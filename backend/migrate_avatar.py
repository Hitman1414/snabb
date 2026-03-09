from sqlalchemy import create_engine, text
from app.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
            print("Successfully added avatar_url column to users table")
        except Exception as e:
            print(f"Error migrating database: {e}")
            # Column might already exist
            pass

if __name__ == "__main__":
    migrate()
