import sqlite3
import sys
import os

try:
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snabb.db')
    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Add expo_push_token column
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN expo_push_token TEXT')
        print('Added expo_push_token column to users table')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e).lower():
            print('expo_push_token column already exists')
        else:
            raise

    conn.commit()
    conn.close()
    print('\nPush Token DB migration completed successfully!')
    
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)
