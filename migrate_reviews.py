import sqlite3
import sys

try:
    conn = sqlite3.connect('backend/snabb.db')
    cursor = conn.cursor()
    
    # Create reviews table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ask_id INTEGER NOT NULL,
            reviewer_id INTEGER NOT NULL,
            reviewee_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ask_id) REFERENCES asks (id),
            FOREIGN KEY (reviewer_id) REFERENCES users (id),
            FOREIGN KEY (reviewee_id) REFERENCES users (id)
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_reviews_ask_id ON reviews (ask_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews (reviewer_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews (reviewee_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at)')
    
    conn.commit()
    conn.close()
    print('✅ Reviews table created successfully!')
    
except Exception as e:
    print(f'❌ Error: {e}')
    sys.exit(1)
