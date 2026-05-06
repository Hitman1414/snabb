import sys
import os
sys.path.append(os.getcwd())
import asyncio
from app.routers.auth import forgot_password, ForgotPasswordRequest
from app.database import SessionLocal
from app import models, auth

def test_forgot():
    db = SessionLocal()
    # Create user
    user = db.query(models.User).filter(models.User.email == "test2@example.com").first()
    if not user:
        user = models.User(
            username="test2",
            email="test2@example.com",
            hashed_password=auth.get_password_hash("test"),
            phone_number="123456",
            location="test"
        )
        db.add(user)
        db.commit()

    req = ForgotPasswordRequest(email="test2@example.com")
    print("Calling forgot_password...")
    res = forgot_password(req, db)
    print("Response:", res)
    db.close()

if __name__ == "__main__":
    test_forgot()
