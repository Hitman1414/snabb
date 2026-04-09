from sqlalchemy.orm import sessionmaker
from app import models, schemas
from sqlalchemy import or_

import os
from sqlalchemy import create_engine
DATABASE_URL = f"sqlite:///{os.path.abspath('snabb.db')}"
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=create_engine(DATABASE_URL))

def test_login_logic():
    db = SessionLocal()
    try:
        # Try to find a user like the login route does
        # Using a dummy username that likely exists
        username = "john_doe" 
        user = db.query(models.User).filter(
            or_(
                models.User.username == username,
                models.User.email == username
            )
        ).first()
        
        if user:
            print(f"Found user: {user.username}")
            # Try to validate with Pydantic User schema
            try:
                schemas.User.model_validate(user)
                print("Pydantic validation successful")
            except Exception as e:
                print(f"Pydantic validation failed: {e}")
        else:
            print("User not found")
    finally:
        db.close()

if __name__ == "__main__":
    test_login_logic()
