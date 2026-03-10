from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    phone_number: Optional[str] = None
    location: Optional[str] = None
    is_bot: Optional[bool] = False
    bot_role: Optional[str] = None
    bot_prompt: Optional[str] = None
    expo_push_token: Optional[str] = None
    
    # Pro Fields
    is_pro: Optional[bool] = False
    pro_category: Optional[str] = None
    pro_bio: Optional[str] = None
    pro_verified: Optional[bool] = False
    pro_rating: Optional[float] = 0.0
    pro_completed_tasks: Optional[int] = 0

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    phone_number: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    bot_role: Optional[str] = None
    bot_prompt: Optional[str] = None
    expo_push_token: Optional[str] = None
    
    # Pro Status Update (for application)
    is_pro: Optional[bool] = None
    pro_category: Optional[str] = None
    pro_bio: Optional[str] = None

class User(UserBase):
    id: int
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False
    model_config = ConfigDict(from_attributes=True)

class BotCreate(UserBase):
    pass  # Bots might not need a password, or auth will handle it differently

class AskBase(BaseModel):
    title: str
    description: str
    category: str
    location: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    images: Optional[List[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AskCreate(AskBase):
    pass

class AskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    images: Optional[List[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Ask(AskBase):
    id: int
    status: str
    user_id: int
    server_id: Optional[int] = None
    created_at: datetime
    user: Optional[User] = None
    interested_count: Optional[int] = 0
    response_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)

# Response Schemas
class ResponseBase(BaseModel):
    message: str
    bid_amount: Optional[float] = None

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

# Message Schemas
class MessageBase(BaseModel):
    content: str
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

# Review Schemas
class ReviewBase(BaseModel):
    rating: int  # 1-5
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    ask_id: int
    reviewee_id: int  # Person being reviewed

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

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

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class PushToken(BaseModel):
    token: str

class OTPRequest(BaseModel):
    email_or_phone: str

class OTPVerify(BaseModel):
    email_or_phone: str
    code: str

# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    body: str
    type: str # 'NEW_RESPONSE', 'BID_ACCEPTED', 'ASK_CLOSED', 'NEW_MESSAGE'
    data: Optional[dict] = None

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Conversation Schema
class Conversation(BaseModel):
    other_user: User
    ask: Ask
    last_message: Message
    unread_count: int
    model_config = ConfigDict(from_attributes=True)
