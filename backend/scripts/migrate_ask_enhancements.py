"""
Migration script for Ask Management Enhancements
Adds:
- messages table
- server_id to asks table
- is_interested to responses table
"""
import sqlite3
import os

DB_PATH = "snabb.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Starting migration...")

        # 1. Create messages table
        print("Creating messages table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            ask_id INTEGER,
            content VARCHAR NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT 0,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (receiver_id) REFERENCES users (id),
            FOREIGN KEY (ask_id) REFERENCES asks (id)
        )
        """)
        
        # Create indexes for messages
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_messages_id ON messages (id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_messages_sender_id ON messages (sender_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_messages_receiver_id ON messages (receiver_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_messages_ask_id ON messages (ask_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_messages_created_at ON messages (created_at)")

        # 2. Add server_id to asks table
        print("Adding server_id to asks table...")
        try:
            cursor.execute("ALTER TABLE asks ADD COLUMN server_id INTEGER REFERENCES users(id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_asks_server_id ON asks (server_id)")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e):
                print("Column server_id already exists in asks table")
            else:
                print(f"Error adding server_id: {e}")

        # 3. Add is_interested to responses table
        print("Adding is_interested to responses table...")
        try:
            cursor.execute("ALTER TABLE responses ADD COLUMN is_interested BOOLEAN DEFAULT 0")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e):
                print("Column is_interested already exists in responses table")
            else:
                print(f"Error adding is_interested: {e}")

        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
