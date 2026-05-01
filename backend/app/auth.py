"""
Authentication helpers — JWT issuance, verification, and revocation.

Audit #11: tokens now carry a unique JTI (JWT ID) and we maintain a Redis
blocklist for revoked JTIs. The default access-token lifetime has been
shortened from 30 days → 60 minutes (configurable via env). Combined with
the /auth/logout endpoint that adds the current JTI to the blocklist
(TTL = remaining token lifetime), this gives us revocation-on-logout.
"""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import models, schemas
from .cache import cache_service
from .config import settings
from .database import get_db

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


# ─── Password helpers ─────────────────────────────────────────────────────
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ─── JWT issuance ─────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT with a unique JTI claim."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # Always stamp a unique jti so we can revoke specific tokens.
    to_encode["jti"] = secrets.token_urlsafe(16)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ─── JWT revocation (audit #11) ───────────────────────────────────────────
_BLOCKLIST_KEY_PREFIX = "jwt:blocklist:"
# In-process fallback when Redis is disabled. Bounded loosely; real prod
# deployments must run with Redis enabled for revocation to be reliable
# across workers.
_local_blocklist: dict[str, datetime] = {}


def _is_jti_blocked(jti: str) -> bool:
    if cache_service.enabled and cache_service.redis_client:
        try:
            return cache_service.redis_client.get(f"{_BLOCKLIST_KEY_PREFIX}{jti}") is not None
        except Exception:
            pass
    expiry = _local_blocklist.get(jti)
    if expiry is None:
        return False
    if expiry < datetime.now(timezone.utc):
        _local_blocklist.pop(jti, None)
        return False
    return True


def revoke_jti(jti: str, exp_unix: float) -> None:
    """Add a JTI to the blocklist with TTL = time until token expiry."""
    now = datetime.now(timezone.utc)
    exp_dt = datetime.fromtimestamp(exp_unix, tz=timezone.utc)
    ttl_seconds = max(int((exp_dt - now).total_seconds()), 1)

    if cache_service.enabled and cache_service.redis_client:
        try:
            cache_service.redis_client.setex(f"{_BLOCKLIST_KEY_PREFIX}{jti}", ttl_seconds, "1")
            return
        except Exception:
            pass
    _local_blocklist[jti] = exp_dt


# ─── Dependency: resolve current user from token ──────────────────────────
def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Cookie fallback (web client uses HttpOnly cookie).
    if not token:
        cookie_token = request.cookies.get("access_token")
        if cookie_token and cookie_token.startswith("Bearer "):
            token = cookie_token.split(" ", 1)[1]
        elif cookie_token:
            token = cookie_token

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        jti: Optional[str] = payload.get("jti")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Audit #11: check the revocation blocklist.
    if jti and _is_jti_blocked(jti):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception

    # Audit #26: deny access to soft-deleted accounts.
    if getattr(user, "is_deleted", False):
        raise credentials_exception

    return user


def get_user_from_token(token: str, db: Session) -> Optional[models.User]:
    """Resolve a user from a JWT string outside FastAPI's Bearer dependency flow."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        jti: Optional[str] = payload.get("jti")
        if username is None:
            return None
    except JWTError:
        return None

    if jti and _is_jti_blocked(jti):
        return None

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None or getattr(user, "is_deleted", False):
        return None
    return user


def decode_token_unsafe(token: str) -> dict:
    """Decode without re-validating signature; helpful for the /logout flow
    where the signature has already been verified by `get_current_user`."""
    return jwt.get_unverified_claims(token)
