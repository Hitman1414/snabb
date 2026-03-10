from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    location = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_bot = Column(Boolean, default=False)
    bot_role = Column(String, nullable=True)  # e.g., 'server', 'matchmaker', 'support'
    bot_prompt = Column(String, nullable=True)  # System prompt for the bot
    expo_push_token = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # Pro Features
    is_pro = Column(Boolean, default=False)
    pro_category = Column(String, nullable=True)
    pro_bio = Column(String, nullable=True)
    pro_verified = Column(Boolean, default=False)
    pro_rating = Column(Float, default=0.0)
    pro_completed_tasks = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    asks = relationship("Ask", foreign_keys="Ask.user_id", back_populates="user")
    served_asks = relationship("Ask", foreign_keys="Ask.server_id", back_populates="server")
    responses = relationship("Response", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Ask(Base):
    __tablename__ = "asks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)  # Added index
    location = Column(String, nullable=False, index=True)  # Added index
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    status = Column(String, default="open", index=True)  # Added index
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # Added index
    server_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # The one who fulfilled the ask
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)  # Added index
    
    # New fields for enhanced Create Ask
    images = Column(JSON, nullable=True, default=list)  # Array of image URLs
    latitude = Column(Float, nullable=True)  # GPS latitude
    longitude = Column(Float, nullable=True)  # GPS longitude

    user = relationship("User", foreign_keys=[user_id], back_populates="asks")
    server = relationship("User", foreign_keys=[server_id], back_populates="served_asks")
    responses = relationship("Response", back_populates="ask", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    ask_id = Column(Integer, ForeignKey("asks.id"), nullable=False, index=True)  # Added index
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # Added index
    message = Column(String, nullable=False)
    bid_amount = Column(Float, nullable=True)
    is_accepted = Column(Boolean, default=False)
    is_interested = Column(Boolean, default=False)
    unread_count = Column(Integer, default=0)  # Track unread messages from asker
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    ask = relationship("Ask", back_populates="responses")
    user = relationship("User", back_populates="responses")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    ask_id = Column(Integer, ForeignKey("asks.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # Person giving review
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # Person being reviewed
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    ask = relationship("Ask")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ask_id = Column(Integer, ForeignKey("asks.id"), nullable=True, index=True)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    is_read = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    ask = relationship("Ask")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    type = Column(String, nullable=False)
    data = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="notifications")
