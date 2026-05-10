"""
Pydantic schemas for the API.

Length and validation rules align with the SQLAlchemy column constraints in
models.py. See `app.models` for the source-of-truth length constants — the
numeric literals here intentionally mirror them so the schema layer rejects
oversize payloads BEFORE they hit the database (audit #16).
"""
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re


# ─── Auth helpers (audit #17) ─────────────────────────────────────────────────
PASSWORD_MIN_LEN = 8
PASSWORD_MAX_LEN = 128
_password_pattern = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).+$")


def _validate_password(value: str) -> str:
    if value is None:
        raise ValueError("Password is required")
    if len(value) < PASSWORD_MIN_LEN:
        raise ValueError(f"Password must be at least {PASSWORD_MIN_LEN} characters")
    if len(value) > PASSWORD_MAX_LEN:
        raise ValueError(f"Password must be at most {PASSWORD_MAX_LEN} characters")
    if not _password_pattern.match(value):
        raise ValueError("Password must contain at least one letter and one number")
    return value


# ─── User Schemas ────────────────────────────────────────────────────────────
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=32)
    location: Optional[str] = Field(None, max_length=120)
    is_bot: Optional[bool] = False
    bot_role: Optional[str] = Field(None, max_length=32)
    bot_prompt: Optional[str] = Field(None, max_length=4000)
    expo_push_token: Optional[str] = Field(None, max_length=200)

    # Pro Fields
    is_pro: Optional[bool] = False
    pro_status: Optional[str] = Field(None, max_length=32)  # pending | approved | rejected
    pro_category: Optional[str] = Field(None, max_length=50)
    pro_bio: Optional[str] = Field(None, max_length=500)
    pro_verified: Optional[bool] = False
    pro_rating: Optional[float] = 0.0
    pro_completed_tasks: Optional[int] = 0
    completed_asks_count: Optional[int] = 0


class UserCreate(UserBase):
    password: str = Field(..., min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password(v)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=32)
    location: Optional[str] = Field(None, max_length=120)
    bot_role: Optional[str] = Field(None, max_length=32)
    bot_prompt: Optional[str] = Field(None, max_length=4000)
    expo_push_token: Optional[str] = Field(None, max_length=200)

    pro_category: Optional[str] = Field(None, max_length=50)
    pro_bio: Optional[str] = Field(None, max_length=500)


class ProApplication(BaseModel):
    pro_category: str = Field(..., max_length=50)
    pro_bio: str = Field(..., max_length=500)
    id_card_url: Optional[str] = Field(None, max_length=500)


class User(UserBase):
    """Public User shape — never include hashed_password (audit #25).

    Three layers of defense make leaking the password hash through this
    schema essentially impossible:
      1. UserBase doesn't declare `hashed_password`, so it's not selected.
      2. `extra="ignore"` drops any field name we don't explicitly list.
      3. The `_no_hashed_password` validator below will raise loudly if
         anyone ever adds the attribute back to UserBase by accident.
    """
    id: int
    avatar_url: Optional[str] = Field(None, max_length=500)
    id_card_url: Optional[str] = Field(None, max_length=500)
    created_at: Optional[datetime] = None
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True, extra="ignore")

    @field_validator("*", mode="before")
    @classmethod
    def _no_hashed_password(cls, v, info):
        # Belt-and-braces: refuse to serialize even if a future change
        # introduces a `hashed_password` field on this model.
        if info.field_name == "hashed_password":
            raise ValueError("hashed_password must never be exposed via the User schema")
        return v


class BotCreate(UserBase):
    pass


# ─── Account deletion (audit #26) ────────────────────────────────────────────
class AccountDeleteRequest(BaseModel):
    """Asks for password re-confirmation before soft-delete."""
    password: str = Field(..., min_length=1, max_length=PASSWORD_MAX_LEN)


# ─── Ask Schemas ─────────────────────────────────────────────────────────────
class AskBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    category: str = Field(..., max_length=50)
    location: str = Field(..., max_length=120)
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    images: Optional[List[str]] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    contact_phone: Optional[str] = Field(None, max_length=32)
    status: Optional[str] = Field("open", max_length=32)


class AskCreate(AskBase):
    pass


class AskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=5000)
    category: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=120)
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    images: Optional[List[str]] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    status: Optional[str] = Field(None, max_length=32)


class Ask(AskBase):
    id: int
    status: str
    user_id: int
    server_id: Optional[int] = None
    created_at: datetime
    user: Optional[User] = None
    interested_count: Optional[int] = 0
    response_count: Optional[int] = 0

    # Audit #3: surface payment status to clients so UI can reflect it.
    payment_status: Optional[str] = "unpaid"
    paid_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─── Response Schemas ────────────────────────────────────────────────────────
class ResponseBase(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    bid_amount: Optional[float] = Field(None, ge=0)


class ResponseCreate(ResponseBase):
    pass


class Response(ResponseBase):
    id: int
    ask_id: int
    user_id: int
    is_accepted: bool
    is_interested: bool
    unread_count: int = 0
    created_at: datetime
    user: Optional[User] = None
    model_config = ConfigDict(from_attributes=True)


# ─── Message Schemas ─────────────────────────────────────────────────────────
class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    ask_id: Optional[int] = None


class MessageCreate(MessageBase):
    receiver_id: int


class Message(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    created_at: datetime
    is_read: bool
    sender: Optional[User] = None
    receiver: Optional[User] = None
    model_config = ConfigDict(from_attributes=True)


# ─── Review Schemas ──────────────────────────────────────────────────────────
class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class ReviewCreate(ReviewBase):
    ask_id: int
    reviewee_id: int


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class Review(ReviewBase):
    id: int
    ask_id: int
    reviewer_id: int
    reviewee_id: int
    created_at: datetime
    updated_at: datetime
    reviewer: Optional[User] = None
    reviewee: Optional[User] = None
    model_config = ConfigDict(from_attributes=True)


# ─── Token Schemas ───────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class PushToken(BaseModel):
    token: str = Field(..., max_length=200)


class OTPRequest(BaseModel):
    email_or_phone: str = Field(..., min_length=3, max_length=254)


class OTPVerify(BaseModel):
    email_or_phone: str = Field(..., min_length=3, max_length=254)
    code: str = Field(..., min_length=4, max_length=10)


# ─── Notification Schemas ───────────────────────────────────────────────────
class NotificationBase(BaseModel):
    title: str = Field(..., max_length=200)
    body: str = Field(..., max_length=2000)
    type: str = Field(..., max_length=32)
    data: Optional[dict] = None


class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ─── Conversation Schema ─────────────────────────────────────────────────────
class Conversation(BaseModel):
    other_user: User
    ask: Ask
    last_message: Message
    unread_count: int
    model_config = ConfigDict(from_attributes=True)


# ─── Moderation Schemas ──────────────────────────────────────────────────────
class ModerationLogBase(BaseModel):
    content_type: str = Field(..., max_length=32)
    content_text: str = Field(..., max_length=5000)
    flagged_reason: str = Field(..., max_length=1000)
    platform: Optional[str] = Field("unknown", max_length=32)


class ModerationLog(ModerationLogBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[User] = None
    model_config = ConfigDict(from_attributes=True)


# ─── WebSocket ticket (audit #21) ────────────────────────────────────────────
class WSTicket(BaseModel):
    ticket: str
    expires_in: int  # seconds
