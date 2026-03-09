import sqlite3
import sys

try:
    conn = sqlite3.connect('backend/snabb.db')
    cursor = conn.cursor()
    
    # Add images column
    try:
        cursor.execute('ALTER TABLE asks ADD COLUMN images TEXT')
        print('✅ Added images column')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e):
            print('⚠️  images column already exists')
        else:
            raise
    
    # Add latitude column
    try:
        cursor.execute('ALTER TABLE asks ADD COLUMN latitude REAL')
        print('✅ Added latitude column')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e):
            print('⚠️  latitude column already exists')
        else:
            raise
    
    # Add longitude column
    try:
        cursor.execute('ALTER TABLE asks ADD COLUMN longitude REAL')
        print('✅ Added longitude column')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e):
            print('⚠️  longitude column already exists')
        else:
            raise
    
    conn.commit()
    conn.close()
    print('\n✅ Database migration completed successfully!')
    
except Exception as e:
    print(f'❌ Error: {e}')
    sys.exit(1)
