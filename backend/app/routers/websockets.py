from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import logging
from ..database import get_db
from ..config import settings
from ..websocket_manager import manager
from .. import models

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websockets"])

async def get_current_user_ws(token: str, db: Session):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        user = db.query(models.User).filter(models.User.username == username).first()
        return user
    except JWTError:
        return None

@router.websocket("/chat")
async def websocket_endpoint(
    websocket: WebSocket, 
    token: str = Query(..., description="JWT token for authentication"),
    db: Session = Depends(get_db)
):
    user = await get_current_user_ws(token, db)
    
    if not user:
        logger.warning("WebSocket connection attempt with invalid token.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(websocket, user.id)
    
    try:
        while True:
            # We mostly use this connection to PUSH data to the client, 
            # but we can also handle incoming WS messages if needed.
            # Currently, standard message sending goes through POST /messages
            # and then gets pushed out through the WS manager.
            # We receive text to keep the connection alive (pings).
            data = await websocket.receive_text()
            logger.debug(f"Received WS data from {user.id}: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
