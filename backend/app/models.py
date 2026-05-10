from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base

# ─── Length constants (audit #16) ───────────────────────────────────────────
USERNAME_LEN = 50
EMAIL_LEN = 254
PHONE_LEN = 32
LOCATION_LEN = 120
URL_LEN = 500
NAME_LEN = 80
BIO_LEN = 500
TITLE_LEN = 200
DESCRIPTION_LEN = 5000
CATEGORY_LEN = 50
MESSAGE_LEN = 2000
COMMENT_LEN = 1000
STATUS_LEN = 32
HASHED_PASSWORD_LEN = 255
PUSH_TOKEN_LEN = 200
PROMPT_LEN = 4000


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(USERNAME_LEN), unique=True, index=True, nullable=False)
    email = Column(String(EMAIL_LEN), unique=True, index=True, nullable=False)
    hashed_password = Column(String(HASHED_PASSWORD_LEN), nullable=False)
    phone_number = Column(String(PHONE_LEN), nullable=True)
    location = Column(String(LOCATION_LEN), nullable=True)
    avatar_url = Column(String(URL_LEN), nullable=True)
    id_card_url = Column(String(URL_LEN), nullable=True)
    is_bot = Column(Boolean, default=False)
    bot_role = Column(String(STATUS_LEN), nullable=True)
    bot_prompt = Column(String(PROMPT_LEN), nullable=True)
    expo_push_token = Column(String(PUSH_TOKEN_LEN), nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    # GDPR / soft-delete (audit #26)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)

    # Pro Features
    is_pro = Column(Boolean, default=False)
    pro_status = Column(String(STATUS_LEN), nullable=True)  # pending | approved | rejected
    pro_category = Column(String(CATEGORY_LEN), nullable=True)
    pro_bio = Column(String(BIO_LEN), nullable=True)
    pro_verified = Column(Boolean, default=False)
    pro_rating = Column(Float, default=0.0)
    pro_completed_tasks = Column(Integer, default=0)

    # AI Subscription Features
    is_ai_subscribed = Column(Boolean, default=False)
    ai_subscription_expiry = Column(DateTime, nullable=True)
    ai_override = Column(Boolean, default=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    asks = relationship("Ask", foreign_keys="Ask.user_id", back_populates="user")
    served_asks = relationship("Ask", foreign_keys="Ask.server_id", back_populates="server")
    responses = relationship("Response", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Ask(Base):
    __tablename__ = "asks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(TITLE_LEN), nullable=False)
    description = Column(String(DESCRIPTION_LEN), nullable=False)
    category = Column(String(CATEGORY_LEN), nullable=False, index=True)
    location = Column(String(LOCATION_LEN), nullable=False, index=True)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    status = Column(String(STATUS_LEN), default="open", index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    server_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    images = Column(JSON, nullable=True, default=list)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact_phone = Column(String(PHONE_LEN), nullable=True)

    payment_status = Column(String(STATUS_LEN), default="unpaid", nullable=False, index=True)
    payment_intent_id = Column(String(URL_LEN), nullable=True, index=True)
    payment_amount = Column(Integer, nullable=True)
    payment_currency = Column(String(8), nullable=True)
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="asks")
    server = relationship("User", foreign_keys=[server_id], back_populates="served_asks")
    responses = relationship("Response", back_populates="ask", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    ask_id = Column(Integer, ForeignKey("asks.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(String(MESSAGE_LEN), nullable=False)
    bid_amount = Column(Float, nullable=True)
    is_accepted = Column(Boolean, default=False)
    is_interested = Column(Boolean, default=False)
    unread_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    ask = relationship("Ask", back_populates="responses")
    user = relationship("User", back_populates="responses")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    ask_id = Column(Integer, ForeignKey("asks.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(String(COMMENT_LEN), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    ask = relationship("Ask")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ask_id = Column(Integer, ForeignKey("asks.id"), nullable=True, index=True)
    content = Column(String(MESSAGE_LEN), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    is_read = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    ask = relationship("Ask")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(TITLE_LEN), nullable=False)
    body = Column(String(MESSAGE_LEN), nullable=False)
    type = Column(String(STATUS_LEN), nullable=False)
    data = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="notifications")


class ModerationLog(Base):
    __tablename__ = "moderation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content_type = Column(String(STATUS_LEN), nullable=False)
    content_text = Column(String(DESCRIPTION_LEN), nullable=False)
    flagged_reason = Column(String(COMMENT_LEN), nullable=False)
    platform = Column(String(STATUS_LEN), default="unknown")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User")
