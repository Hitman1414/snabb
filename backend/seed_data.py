import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from app.auth import get_password_hash

def seed_database():
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create test users
        users = [
            models.User(
                username="john_doe",
                email="john@example.com",
                hashed_password=get_password_hash("password123"),
                phone_number="+919876543210",
                location="Mumbai"
            ),
            models.User(
                username="jane_smith",
                email="jane@example.com",
                hashed_password=get_password_hash("password123"),
                phone_number="+919876543211",
                location="Delhi"
            ),
            models.User(
                username="bob_wilson",
                email="bob@example.com",
                hashed_password=get_password_hash("password123"),
                phone_number="+919876543212",
                location="Bangalore"
            ),
            models.User(
                username="alice_wonder",
                email="alice@example.com",
                hashed_password=get_password_hash("password123"),
                phone_number="+919876543213",
                location="Hyderabad"
            ),
            models.User(
                username="charlie_brown",
                email="charlie@example.com",
                hashed_password=get_password_hash("password123"),
                phone_number="+919876543214",
                location="Chennai"
            ),
        ]
        
        for user in users:
            existing = db.query(models.User).filter(models.User.username == user.username).first()
            if not existing:
                db.add(user)
        
        db.commit()
        
        # Get users
        john = db.query(models.User).filter(models.User.username == "john_doe").first()
        jane = db.query(models.User).filter(models.User.username == "jane_smith").first()
        
        # Create test asks
        asks = [
            models.Ask(
                title="Need a plumber for bathroom repair",
                description="Looking for an experienced plumber to fix leaking pipes in my bathroom. Urgent work needed.",
                category="Services",
                location="Mumbai, Andheri",
                budget_min=2000,
                budget_max=5000,
                user_id=john.id
            ),
            models.Ask(
                title="Selling iPhone 13 Pro",
                description="iPhone 13 Pro, 256GB, Pacific Blue. Excellent condition, 1 year old. Original box and accessories included.",
                category="Electronics",
                location="Delhi, Connaught Place",
                budget_min=50000,
                budget_max=60000,
                user_id=jane.id
            ),
            models.Ask(
                title="Looking for web developer",
                description="Need a freelance web developer for a small business website. React and Node.js experience required.",
                category="Jobs",
                location="Remote",
                budget_min=30000,
                budget_max=50000,
                user_id=john.id
            ),
        ]
        
        for ask in asks:
            existing = db.query(models.Ask).filter(models.Ask.title == ask.title).first()
            if not existing:
                db.add(ask)
        
        db.commit()
        
        print("Database seeded successfully!")
        print(f"Created {len(users)} users and {len(asks)} asks")
        print("\nTest credentials:")
        print("Username: john_doe, Password: password123")
        print("Username: jane_smith, Password: password123")
        print("Username: bob_wilson, Password: password123")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
