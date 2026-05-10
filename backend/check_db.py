import sqlite3
import os

def check():
    db_path = 'snabb.db'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('PRAGMA table_info(users)')
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Columns in users table: {columns}")
    conn.close()

if __name__ == "__main__":
    check()
