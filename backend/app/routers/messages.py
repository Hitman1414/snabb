"""
Messages Router
Handles messaging between users
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..bot_service import process_support_message
from ..websocket_manager import manager
from ..notification_service import create_notification
from fastapi import BackgroundTasks
from fastapi.encoders import jsonable_encoder
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("", response_model=schemas.Message, status_code=status.HTTP_201_CREATED)
def create_message(
    message: schemas.MessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Send a message to another user"""
    # Check if receiver exists
    receiver = db.query(models.User).filter(models.User.id == message.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Check if ask exists if provided
    if message.ask_id:
        ask = db.query(models.Ask).filter(models.Ask.id == message.ask_id).first()
        if not ask:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ask not found"
            )
        
        # If sender is the asker and receiver is a server (responder), increment unread count
        if current_user.id == ask.user_id:
            response = db.query(models.Response).filter(
                models.Response.ask_id == message.ask_id,
                models.Response.user_id == message.receiver_id
            ).first()
            if response:
                response.unread_count += 1
    
    db_message = models.Message(
        **message.model_dump(),
        sender_id=current_user.id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    # Audit #24: only spawn the support-bot coroutine when a bot is on
    # either side of the conversation. Previously this fired for every
    # human-to-human message, opening a DB session and running an LLM
    # check just to early-return.
    if getattr(receiver, "is_bot", False) or getattr(current_user, "is_bot", False):
        background_tasks.add_task(process_support_message, db_message.id)
    
    # Send WebSocket notification to receiver
    ws_payload = {
        "type": "NEW_MESSAGE",
        "data": jsonable_encoder(schemas.Message.model_validate(db_message))
    }
    # This needs to be awaited if we were in an async route, but we are in a sync def.
    # FASTAPI Background task is best here, or wrap in an asyncio block.
    # Since background_tasks run async functions nicely:
    async def notify_ws(payload, user_id):
        await manager.send_personal_message(payload, user_id)
        
    background_tasks.add_task(notify_ws, ws_payload, message.receiver_id)
    
    # Send Notification
    create_notification(
        db=db,
        user_id=message.receiver_id,
        title=f"New message from {current_user.username}",
        body=message.content[:100],
        notification_type="NEW_MESSAGE",
        data={"ask_id": message.ask_id, "sender_id": current_user.id}
    )
    
    logger.info(f"Message sent from {current_user.id} to {message.receiver_id}")
    return db_message

@router.get("", response_model=List[schemas.Message])
def get_messages(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all messages for current user (sent and received)"""
    messages = db.query(models.Message).filter(
        (models.Message.sender_id == current_user.id) | 
        (models.Message.receiver_id == current_user.id)
    ).order_by(models.Message.created_at.desc()).all()
    return messages

@router.get("/conversation/{other_user_id}", response_model=List[schemas.Message])
def get_conversation(
    other_user_id: int,
    ask_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get conversation with specific user, optionally filtered by ask"""
    query = db.query(models.Message).filter(
        ((models.Message.sender_id == current_user.id) & (models.Message.receiver_id == other_user_id)) |
        ((models.Message.sender_id == other_user_id) & (models.Message.receiver_id == current_user.id))
    )
    
    if ask_id:
        query = query.filter(models.Message.ask_id == ask_id)
        
    messages = query.order_by(models.Message.created_at.asc()).all()
    return messages

@router.post("/mark-read/{ask_id}", status_code=status.HTTP_200_OK)
def mark_messages_read(
    ask_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark all unread messages as read for a specific ask conversation"""
    # Mark all messages in this ask conversation where current_user is the receiver
    unread_messages = db.query(models.Message).filter(
        models.Message.ask_id == ask_id,
        models.Message.receiver_id == current_user.id,
        ~models.Message.is_read
    ).all()

    for msg in unread_messages:
        msg.is_read = True

    # Also reset unread_count on Response if it exists (for responders)
    response = db.query(models.Response).filter(
        models.Response.ask_id == ask_id,
        models.Response.user_id == current_user.id
    ).first()
    if response:
        response.unread_count = 0

    db.commit()

    logger.info(f"Marked {len(unread_messages)} messages as read for ask {ask_id} by user {current_user.id}")
    return {"message": "Messages marked as read", "count": len(unread_messages)}

@router.get("/conversations", response_model=List[schemas.Conversation])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get all conversations grouped by (other_user, ask).

    Audit #14: previously this endpoint did 1 + 2N queries (one per
    conversation, for User and Ask lookups). We now eager-load sender,
    receiver, and ask in the single message query — total = 1 query
    regardless of conversation count.
    """
    messages = (
        db.query(models.Message)
        .options(
            joinedload(models.Message.sender),
            joinedload(models.Message.receiver),
            joinedload(models.Message.ask),
        )
        .filter(
            (models.Message.sender_id == current_user.id)
            | (models.Message.receiver_id == current_user.id)
        )
        .order_by(models.Message.created_at.desc())
        .all()
    )

    # Group in memory; relationships are already loaded so no further
    # database round-trips occur in this loop.
    conversations: dict[tuple[int, int], dict] = {}
    for msg in messages:
        if not msg.ask_id:
            # We don't currently surface ask-less DMs in the conversation list.
            continue

        other_user = msg.receiver if msg.sender_id == current_user.id else msg.sender
        if other_user is None or msg.ask is None:
            # Defensive: ignore orphaned messages whose related rows were
            # deleted (e.g. ask deleted but message retained pre-cascade).
            continue

        key = (other_user.id, msg.ask_id)
        bucket = conversations.get(key)
        if bucket is None:
            # First (= most recent due to DESC ordering) message wins.
            conversations[key] = {
                "other_user": other_user,
                "ask": msg.ask,
                "last_message": msg,
                "unread_count": 0,
            }
            bucket = conversations[key]

        if msg.receiver_id == current_user.id and not msg.is_read:
            bucket["unread_count"] += 1

    return list(conversations.values())
