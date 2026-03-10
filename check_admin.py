import os
from sqlalchemy.orm import Session
from dotenv import load_dotenv
load_dotenv('backend/.env')

from backend.app.database import SessionLocal
from backend.app import models

def check_admin(email):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            print(f"User: {user.email}")
            print(f"Is Admin: {user.is_admin}")
        else:
            print(f"User {email} not found!")
    finally:
        db.close()

if __name__ == "__main__":
    check_admin("snabb@example.com")
