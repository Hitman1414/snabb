# Snabb Backend - Production Deployment Guide

## Prerequisites
- Python 3.10+
- PostgreSQL 14+ (for production)
- Redis 7+ (for caching)

## Installation

### 1. Install Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your production values
```

### 3. Database Setup
```bash
# For PostgreSQL
createdb snabb

# Run migrations
alembic upgrade head
```

### 4. Redis Setup
```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Verify Redis is running
redis-cli ping  # Should return PONG
```

## Running the Server

### Development
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```bash
# Using Gunicorn with Uvicorn workers
gunicorn app.main:app -c gunicorn.conf.py

# Or with custom settings
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 30 \
  --access-logfile - \
  --error-logfile -
```

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key (generate with `openssl rand -hex 32`)
- `REDIS_URL`: Redis connection string

### Optional
- `REDIS_ENABLED`: Enable/disable Redis caching (default: False)
- `SENTRY_DSN`: Sentry error tracking DSN
- `IMAGE_CDN_URL`: CDN URL for image serving
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)

## Performance Tuning

### Database Indexes
Indexes are automatically created via Alembic migrations:
- `idx_asks_category` - Filter by category
- `idx_asks_status` - Filter by status
- `idx_asks_created_at` - Sort by date
- `idx_asks_user_id` - User's asks
- `idx_responses_ask_id` - Responses for ask
- `idx_responses_user_id` - User's responses

### Redis Caching
- Default TTL: 300 seconds (5 minutes)
- Cached endpoints: `/asks`, `/responses/ask/{id}`
- Cache invalidation: Automatic on create/update/delete

### Connection Pooling
SQLAlchemy connection pool settings:
```python
# In database.py
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True
)
```

## Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### Metrics (if Prometheus enabled)
```bash
curl http://localhost:8000/metrics
```

## Deployment Platforms

### Render
1. Create new Web Service
2. Connect GitHub repository
3. Build Command: `pip install -r backend/requirements.txt`
4. Start Command: `cd backend && gunicorn app.main:app -c gunicorn.conf.py`
5. Add environment variables

### Railway
1. Create new project
2. Add PostgreSQL and Redis services
3. Deploy from GitHub
4. Configure environment variables

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["gunicorn", "app.main:app", "-c", "gunicorn.conf.py"]
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Check connection
redis-cli -u redis://localhost:6379/0 ping

# If Redis is not available, set REDIS_ENABLED=False
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql $DATABASE_URL

# Check connection string format
# postgresql://user:password@host:port/database
```

### Performance Issues
```bash
# Check slow queries
# Enable SQL logging: DB_ECHO=True

# Monitor Redis
redis-cli --stat

# Check Gunicorn workers
ps aux | grep gunicorn
```
