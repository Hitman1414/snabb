from sqlalchemy.orm import Session
from . import models
from .push_service import send_push_message
import logging

logger = logging.getLogger(__name__)

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    body: str,
    notification_type: str,
    data: dict = None
):
    """
    Create a database notification and send a push notification if token exists.
    """
    try:
        # 1. Save to Database
        db_notification = models.Notification(
            user_id=user_id,
            title=title,
            body=body,
            type=notification_type,
            data=data
        )
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        
        # 2. Send Push Notification
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user and user.expo_push_token:
            send_push_message(
                user.expo_push_token,
                f"{title}: {body}",
                extra={
                    "type": notification_type,
                    "notification_id": db_notification.id,
                    **(data or {})
                }
            )
            
        logger.info(f"Notification created for user {user_id}: {title}")
        return db_notification
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        return None
