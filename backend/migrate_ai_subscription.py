import sqlite3
import os

def migrate():
    db_path = 'C:/Users/prate/.codex/memories/snabb_dev.db'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print(f"Migrating database at: {db_path}")

        print("Adding ai_override column...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN ai_override BOOLEAN DEFAULT 0")
            print("Successfully added ai_override.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("Column ai_override already exists.")
            else:
                raise e

        conn.commit()
        conn.close()
        print("Migration completed successfully.")

    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
