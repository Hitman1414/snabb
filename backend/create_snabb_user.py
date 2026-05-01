from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

db = SessionLocal()

user = db.query(models.User).filter(models.User.email == "snabb@example.com").first()

if not user:
    new_user = models.User(
        username="snabb_admin",
        email="snabb@example.com",
        hashed_password=get_password_hash("password123"),
        phone_number="+919999999999",
        location="Global",
        is_admin=True,
    )
    db.add(new_user)
    db.commit()
    print("Created snabb@example.com user with password: password123")
else:
    user.username = "snabb_admin"
    user.hashed_password = get_password_hash("password123")
    user.is_admin = True
    db.commit()
    print("Updated snabb@example.com admin user with password: password123")
