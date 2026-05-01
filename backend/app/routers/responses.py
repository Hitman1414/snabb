from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
import logging
from fastapi import BackgroundTasks
from .. import models, schemas, auth
from ..database import get_db
from ..config import settings
from ..notification_service import create_notification

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/responses", tags=["responses"])

# Audit #23: standardized on /responses/ask/{ask_id}. The
# /responses/asks/{ask_id}/responses alias was unused by any client and
# has been removed. If anything external depended on it, surface a 404
# and update — the canonical route is /responses/ask/{ask_id}.
@router.get("/ask/{ask_id}", response_model=List[schemas.Response])
def get_responses_for_ask(
    ask_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    db: Session = Depends(get_db)
):
    """Get paginated responses for a specific ask."""
    logger.info(f"Fetching responses for ask_id: {ask_id} (skip: {skip}, limit: {limit})")
    
    # Eager load user data
    responses = db.query(models.Response).options(joinedload(models.Response.user)).filter(
        models.Response.ask_id == ask_id
    ).order_by(models.Response.created_at.desc()).offset(skip).limit(limit).all()
    
    logger.info(f"Found {len(responses)} responses for ask_id: {ask_id}")
    
    # Invalidate cache when new response is added
    return responses

@router.post("/ask/{ask_id}", response_model=schemas.Response, status_code=status.HTTP_201_CREATED)
def create_response(
    ask_id: int,
    response: schemas.ResponseCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"User {current_user.id} creating response for ask_id: {ask_id}")
    # Check if ask exists
    ask = db.query(models.Ask).filter(models.Ask.id == ask_id).first()
    if not ask:
        logger.warning(f"Ask {ask_id} not found")
        raise HTTPException(status_code=404, detail="Ask not found")
    
    # Check if ask is open
    if ask.status != "open":
        logger.warning(f"Ask {ask_id} is closed")
        raise HTTPException(status_code=400, detail="Ask is closed")
    
    # Check if user is not the ask owner
    if ask.user_id == current_user.id:
        logger.warning(f"User {current_user.id} tried to respond to own ask {ask_id}")
        raise HTTPException(status_code=400, detail="Cannot respond to your own ask")
    
    db_response = models.Response(
        **response.model_dump(),
        ask_id=ask_id,
        user_id=current_user.id
    )
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    logger.info(f"Response {db_response.id} created successfully")
    
    # Send Notification to the Ask owner
    create_notification(
        db=db,
        user_id=ask.user_id,
        title="New Bid Received",
        body=f"{current_user.username} placed a bid of ${db_response.bid_amount} on '{ask.title}'",
        notification_type="NEW_BID",
        data={"ask_id": ask_id, "response_id": db_response.id, "sender_id": current_user.id}
    )
    
    return db_response

@router.get("/my", response_model=List[schemas.Response])
def get_my_responses(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Fetching responses for user {current_user.id}")
    responses = db.query(models.Response).filter(models.Response.user_id == current_user.id).all()
    logger.info(f"Found {len(responses)} responses for user {current_user.id}")
    return responses

@router.post("/{response_id}/accept", response_model=schemas.Response)
def accept_response(
    response_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"User {current_user.id} accepting response {response_id}")
    db_response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not db_response:
        logger.warning(f"Response {response_id} not found")
        raise HTTPException(status_code=404, detail="Response not found")
    
    # Check if current user is the ask owner
    ask = db.query(models.Ask).filter(models.Ask.id == db_response.ask_id).first()
    if ask.user_id != current_user.id:
        logger.warning(f"User {current_user.id} not authorized to accept response {response_id}")
        raise HTTPException(status_code=403, detail="Not authorized to accept this response")
    
    # Mark response as accepted
    db_response.is_accepted = True
    
    # Update ask status and set server (helper)
    ask.status = "in_progress"
    ask.server_id = db_response.user_id
    
    db.commit()
    db.refresh(db_response)
    
    # Notify the helper
    create_notification(
        db=db,
        user_id=db_response.user_id,
        title="Bid Accepted! 🎉",
        body=f"Your bid for '{ask.title}' was accepted by {current_user.username}",
        notification_type="BID_ACCEPTED",
        data={"ask_id": ask.id, "response_id": db_response.id}
    )
    
    logger.info(f"Response {response_id} accepted, ask {ask.id} closed")
    return db_response

@router.delete("/{response_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_response(
    response_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"User {current_user.id} deleting response {response_id}")
    db_response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not db_response:
        logger.warning(f"Response {response_id} not found")
        raise HTTPException(status_code=404, detail="Response not found")
    if db_response.user_id != current_user.id:
        logger.warning(f"User {current_user.id} not authorized to delete response {response_id}")
        raise HTTPException(status_code=403, detail="Not authorized to delete this response")
    
    db.delete(db_response)
    db.commit()
    logger.info(f"Response {response_id} deleted successfully")
    return None

@router.put("/{response_id}/interested", response_model=schemas.Response)
def toggle_interested(
    response_id: int,
    background_tasks: BackgroundTasks,
    is_interested: bool = Query(..., description="Set interested status"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle interested status for a response"""
    logger.info(f"User {current_user.id} toggling interested for response {response_id} to {is_interested}")
    db_response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not db_response:
        raise HTTPException(status_code=404, detail="Response not found")
    
    # Check if current user is the ask owner
    ask = db.query(models.Ask).filter(models.Ask.id == db_response.ask_id).first()
    if ask.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this response")
    
    db_response.is_interested = is_interested
    db.commit()
    db.refresh(db_response)

    # Send notification to the helper when shortlisted
    if is_interested:
        create_notification(
            db=db,
            user_id=db_response.user_id,
            title="Shortlisted! 🎯",
            body=f"{current_user.username} is interested in your bid for '{ask.title}'",
            notification_type="SHORTLISTED",
            data={"ask_id": ask.id, "response_id": db_response.id}
        )

    return db_response
