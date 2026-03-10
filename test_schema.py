from sqlalchemy.orm import Session, sessionmaker
from backend.app.database import SessionLocal
from backend.app import models, schemas
from sqlalchemy import or_

from sqlalchemy import create_engine
DATABASE_URL = "sqlite:///backend/snabb.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
                pydantic_user = schemas.User.model_validate(user)
                print("Pydantic validation successful")
            except Exception as e:
                print(f"Pydantic validation failed: {e}")
        else:
            print("User not found")
    finally:
        db.close()

if __name__ == "__main__":
    test_login_logic()
