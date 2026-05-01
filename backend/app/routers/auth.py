"""
Authentication routes — register / login / logout / OTP / password reset.
"""
from datetime import timedelta
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db
from ..otp_service import send_otp, verify_otp

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user. Pydantic enforces the password strength rules."""
    logger.info(f"Registration attempt for username: {user.username}, email: {user.email}")

    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")

    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=auth.get_password_hash(user.password),
        phone_number=user.phone_number,
        location=user.location,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"User {db_user.id} registered successfully")
    return db_user


@router.post("/login", response_model=schemas.Token)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    logger.info(f"Login attempt for username/email: {form_data.username}")
    user = db.query(models.User).filter(
        or_(
            models.User.username == form_data.username,
            models.User.email == form_data.username,
        )
    ).first()

    # Soft-deleted accounts must not log back in.
    if not user or getattr(user, "is_deleted", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires,
    )

    # HttpOnly cookie for the web client. Mobile uses the body token.
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,
        samesite="none",
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    logger.info(f"User {user.id} logged in successfully")
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    request: Request,
    response: Response,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Invalidate the current token and clear the cookie (audit #11)."""
    # Pull the token from header or cookie (same precedence as get_current_user).
    token = None
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
    if not token:
        cookie_token = request.cookies.get("access_token")
        if cookie_token and cookie_token.startswith("Bearer "):
            token = cookie_token.split(" ", 1)[1]
        elif cookie_token:
            token = cookie_token

    if token:
        try:
            claims = auth.decode_token_unsafe(token)
            jti = claims.get("jti")
            exp = claims.get("exp")
            if jti and exp:
                auth.revoke_jti(jti, float(exp))
        except Exception as e:
            # Don't leak internals; logout should always appear successful.
            logger.warning(f"Logout could not parse token claims: {e}")

    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ─── OTP ──────────────────────────────────────────────────────────────────
@router.post("/send-otp")
def request_otp(otp_request: schemas.OTPRequest):
    """Send a verification code to the given email or phone."""
    success = send_otp(otp_request.email_or_phone)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP")
    return {"message": "OTP sent successfully"}


@router.post("/verify-otp")
def validate_otp(otp_verify: schemas.OTPVerify, db: Session = Depends(get_db)):
    """Verify the code and return an access token if the user exists."""
    if not verify_otp(otp_verify.email_or_phone, otp_verify.code):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = db.query(models.User).filter(
        or_(
            models.User.email == otp_verify.email_or_phone,
            models.User.phone_number == otp_verify.email_or_phone,
        )
    ).first()

    if user and not getattr(user, "is_deleted", False):
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {
            "message": "OTP verified successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "is_new_user": False,
        }

    return {"message": "OTP verified successfully", "is_new_user": True}


# ─── Forgot / reset password ──────────────────────────────────────────────
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=10)
    new_password: str = Field(..., min_length=schemas.PASSWORD_MIN_LEN, max_length=schemas.PASSWORD_MAX_LEN)


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiate password recovery. Always returns success to prevent enumeration."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if user and not getattr(user, "is_deleted", False):
        send_otp(req.email)  # OTP service handles its own logging on failure.
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Complete password recovery."""
    if not verify_otp(req.email, req.code):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or getattr(user, "is_deleted", False):
        raise HTTPException(status_code=404, detail="User not found")

    # Re-validate password strength (mirror UserCreate rules).
    schemas._validate_password(req.new_password)

    user.hashed_password = auth.get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password has been reset successfully."}
