"""
Migration script to add unread_count column to responses table
"""
import sqlite3
import os

def migrate():
    # Database path
    db_path = "snabb.db"
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found!")
        return
    
    print("Starting migration...")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add unread_count column to responses table
        print("Adding unread_count to responses table...")
        cursor.execute("""
            ALTER TABLE responses 
            ADD COLUMN unread_count INTEGER DEFAULT 0
        """)
        
        conn.commit()
        print("Migration completed successfully!")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column unread_count already exists, skipping...")
        else:
            print(f"Error during migration: {e}")
            conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
