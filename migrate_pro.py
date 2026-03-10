import sqlite3
import os

def migrate():
    # Detect the path to the database file
    db_path = os.path.join(os.path.dirname(__file__), "backend", "snabb.db")
    if not os.path.exists(db_path):
        db_path = "backend/snabb.db"
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    print(f"Migrating database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("is_pro", "BOOLEAN DEFAULT 0"),
        ("pro_category", "VARCHAR"),
        ("pro_bio", "VARCHAR"),
        ("pro_verified", "BOOLEAN DEFAULT 0"),
        ("pro_rating", "FLOAT DEFAULT 0.0"),
        ("pro_completed_tasks", "INTEGER DEFAULT 0"),
        ("is_active", "BOOLEAN DEFAULT 1")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"Added column: {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration completed!")

if __name__ == "__main__":
    migrate()
