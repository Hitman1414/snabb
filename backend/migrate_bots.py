import sqlite3
import sys
import os

try:
    # Get absolute path to the database
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snabb.db')
    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Add is_bot column
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN is_bot BOOLEAN DEFAULT 0')
        print('Added is_bot column to users table')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e).lower():
            print('is_bot column already exists')
        else:
            raise
    
    # Add bot_role column
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN bot_role TEXT')
        print('Added bot_role column to users table')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e).lower():
            print('bot_role column already exists')
        else:
            raise
    
    # Add bot_prompt column
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN bot_prompt TEXT')
        print('Added bot_prompt column to users table')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e).lower():
            print('bot_prompt column already exists')
        else:
            raise

    conn.commit()
    conn.close()
    print('\nBot DB migration completed successfully!')
    
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)
