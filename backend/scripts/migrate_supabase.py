import sys
import os
from dotenv import load_dotenv

# Load .env from backend folder
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.database import engine, Base
from backend.app.config import settings
from sqlalchemy import text

def add_column(conn, table, column, col_type):
    try:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
        conn.commit()
        print(f"✅ Added column '{column}' to '{table}'")
    except Exception as e:
        conn.rollback()
        if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
            print(f"ℹ️ Column '{column}' already exists in '{table}'")
        else:
            print(f"❌ Error adding '{column}' to '{table}': {e}")

def migrate():
    print(f"🚀 Starting manual migration for: {settings.DATABASE_URL}")
    
    # Ensure tables exist first
    print("Creating tables (if missing)...")
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        # 1. Update Users table
        print("\nChecking 'users' table...")
        columns_to_add = {
            "is_bot": "BOOLEAN DEFAULT FALSE",
            "bot_role": "VARCHAR",
            "bot_prompt": "VARCHAR",
            "expo_push_token": "VARCHAR",
            "is_active": "BOOLEAN DEFAULT TRUE",
            "is_pro": "BOOLEAN DEFAULT FALSE",
            "pro_category": "VARCHAR",
            "pro_bio": "VARCHAR",
            "pro_verified": "BOOLEAN DEFAULT FALSE",
            "pro_rating": "FLOAT DEFAULT 0.0",
            "pro_completed_tasks": "INTEGER DEFAULT 0",
            "is_admin": "BOOLEAN DEFAULT FALSE"
        }
        
        for col, col_type in columns_to_add.items():
            add_column(conn, "users", col, col_type)
        
        # 2. Update Asks table
        print("\nChecking 'asks' table...")
        ask_columns = {
            "images": "JSONB DEFAULT '[]'::jsonb",
            "latitude": "FLOAT",
            "longitude": "FLOAT",
            "server_id": "INTEGER REFERENCES users(id)"
        }
        
        for col, col_type in ask_columns.items():
            add_column(conn, "asks", col, col_type)

        # 3. Update Responses table
        print("\nChecking 'responses' table...")
        response_columns = {
            "unread_count": "INTEGER DEFAULT 0"
        }
        
        for col, col_type in response_columns.items():
            add_column(conn, "responses", col, col_type)
    
    print("\n✨ Migration finished!")

if __name__ == "__main__":
    migrate()
