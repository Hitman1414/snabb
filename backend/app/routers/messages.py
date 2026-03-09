"""
Messages Router
Handles messaging between users
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..bot_service import process_support_message_sync
from ..websocket_manager import manager
from ..push_service import send_push_message
from ..notification_service import create_notification
from fastapi import BackgroundTasks
from fastapi.encoders import jsonable_encoder
import logging
import asyncio

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
    
    # Trigger AI Support bot processing
    background_tasks.add_task(process_support_message_sync, db_message.id, db)
    
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
        models.Message.is_read == False
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
    current_user: models.User = Depends(get_current_user)
):
    """Get all conversations grouped by user and ask"""
    # Fetch all messages involving current user
    messages = db.query(models.Message).filter(
        (models.Message.sender_id == current_user.id) | 
        (models.Message.receiver_id == current_user.id)
    ).order_by(models.Message.created_at.desc()).all()

    conversations_map = {}

    for msg in messages:
        other_user_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        ask_id = msg.ask_id
        
        # Skip messages without ask_id for now as per requirement
        if not ask_id:
            continue

        key = (other_user_id, ask_id)
        
        if key not in conversations_map:
            conversations_map[key] = {
                "last_message": msg,
                "unread_count": 0,
                "other_user_id": other_user_id,
                "ask_id": ask_id
            }
        
        # Count unread messages where current user is receiver
        if msg.receiver_id == current_user.id and not msg.is_read:
            conversations_map[key]["unread_count"] += 1

    result = []
    for key, data in conversations_map.items():
        other_user = db.query(models.User).filter(models.User.id == data["other_user_id"]).first()
        ask = db.query(models.Ask).filter(models.Ask.id == data["ask_id"]).first()
        
        if other_user and ask:
            result.append({
                "other_user": other_user,
                "ask": ask,
                "last_message": data["last_message"],
                "unread_count": data["unread_count"]
            })
            
    return result
