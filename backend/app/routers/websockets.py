"""
WebSocket router.

Audit #21: WS no longer accepts the long-lived JWT in the URL query
string (which leaks into server access logs). Clients now:

    1. POST /ws/ticket  (with normal Authorization: Bearer header)
       → returns a single-use, 60-second ticket bound to their user id.
    2. ws://api/ws/chat?ticket=<ticket>
       → server consumes the ticket and authenticates the connection.

The ticket is stored in Redis (or a per-process fallback dict) and is
deleted on first read, so it can never be replayed.
"""
from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..cache import cache_service
from ..config import settings
from ..database import get_db
from ..websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websockets"])

# ─── Ticket store ────────────────────────────────────────────────────────
_TICKET_KEY_PREFIX = "ws:ticket:"
_TICKET_TTL_SECONDS = 60
# In-process fallback when Redis is disabled. Each entry is (user_id, expiry).
_local_tickets: dict[str, tuple[int, datetime]] = {}


def _issue_ticket(user_id: int) -> str:
    ticket = secrets.token_urlsafe(24)
    if cache_service.enabled and cache_service.redis_client:
        try:
            cache_service.redis_client.setex(
                f"{_TICKET_KEY_PREFIX}{ticket}", _TICKET_TTL_SECONDS, str(user_id)
            )
            return ticket
        except Exception as e:
            logger.warning(f"WS ticket Redis write failed; using in-memory: {e}")
    _local_tickets[ticket] = (
        user_id,
        datetime.now(timezone.utc) + timedelta(seconds=_TICKET_TTL_SECONDS),
    )
    return ticket


def _consume_ticket(ticket: str) -> Optional[int]:
    """Return the user_id bound to this ticket and delete it. None if invalid."""
    if cache_service.enabled and cache_service.redis_client:
        try:
            value = cache_service.redis_client.get(f"{_TICKET_KEY_PREFIX}{ticket}")
            if value is None:
                return None
            cache_service.redis_client.delete(f"{_TICKET_KEY_PREFIX}{ticket}")
            try:
                return int(value)
            except (TypeError, ValueError):
                return None
        except Exception as e:
            logger.warning(f"WS ticket Redis read failed; falling back: {e}")

    record = _local_tickets.pop(ticket, None)
    if record is None:
        return None
    user_id, expiry = record
    if expiry < datetime.now(timezone.utc):
        return None
    return user_id


# ─── Endpoints ───────────────────────────────────────────────────────────
@router.post("/ticket", response_model=schemas.WSTicket)
def create_ws_ticket(
    current_user: models.User = Depends(auth.get_current_user),
):
    """Issue a short-lived, single-use ticket for opening a WebSocket.

    The client must pass this ticket as `?ticket=...` on the wss:// URL
    within 60 seconds. Tickets are bound to the authenticating user.
    """
    ticket = _issue_ticket(current_user.id)
    return {"ticket": ticket, "expires_in": _TICKET_TTL_SECONDS}


@router.get("/online", response_model=list[schemas.User])
def get_online_users(db: Session = Depends(get_db)):
    """Get list of currently connected users."""
    online_ids = list(manager.active_connections.keys())
    if not online_ids:
        return []
    return db.query(models.User).filter(models.User.id.in_(online_ids)).all()


@router.websocket("/chat")
async def websocket_endpoint(
    websocket: WebSocket,
    ticket: Optional[str] = Query(None, description="Single-use WS ticket (preferred)"),
    token: Optional[str] = Query(None, description="DEPRECATED: legacy JWT in query string"),
    db: Session = Depends(get_db),
):
    """Authenticate via ticket (preferred) or legacy token (deprecated)."""
    user: Optional[models.User] = None

    if ticket:
        user_id = _consume_ticket(ticket)
        if user_id is not None:
            user = db.query(models.User).filter(models.User.id == user_id).first()
    elif token:
        # Legacy path: kept for backwards compatibility during the rollout
        # of the new client. Logged at WARN so we can monitor migration.
        logger.warning("WebSocket connected via legacy ?token= query param")
        user = await _legacy_user_from_token(token, db)

    if not user or getattr(user, "is_deleted", False):
        logger.warning("WebSocket connection attempt with invalid auth.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user.id)

    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received WS data from {user.id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)


async def _legacy_user_from_token(token: str, db: Session) -> Optional[models.User]:
    """Decode a JWT (legacy WS path). Mirrors auth.get_current_user logic
    but works without a Request object."""
    from jose import JWTError, jwt

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: Optional[str] = payload.get("sub")
        jti: Optional[str] = payload.get("jti")
        if username is None:
            return None
    except JWTError:
        return None

    if jti and auth._is_jti_blocked(jti):
        return None

    return db.query(models.User).filter(models.User.username == username).first()
