from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging
from .database import engine, Base
from .routers import auth, asks, responses, reviews, messages, users, websockets, payments, notifications, admin
from .config import settings
from .cache import cache_service
from .middleware import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
    api_error_handler,
    APIError,
    RateLimitMiddleware,
)
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import sentry_sdk

sentry_sdk.init(
    dsn="https://dummyPublicKey@o0.ingest.sentry.io/0",
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables (ONLY in Debug mode)
# In production, we use Alembic migrations: alembic upgrade head
if settings.DEBUG:
    logger.info("🔧 Debug mode: Auto-creating database tables")
    Base.metadata.create_all(bind=engine)
else:
    logger.info("🚀 Production mode: Skipping auto-table creation (use Alembic)")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"✨ Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"📊 Environment: {'DEVELOPMENT' if settings.DEBUG else 'PRODUCTION'}")
    
    # Log sanitized DB info
    db_type = 'SQLite'
    if '@' in settings.DATABASE_URL:
        db_type = settings.DATABASE_URL.split('@')[-1].split('/')[0]
    logger.info(f"💾 Database: {db_type}")
    logger.info(f"🔴 Redis cache: {'Enabled' if settings.REDIS_ENABLED else 'Disabled'}")
    if cache_service.enabled:
        logger.info("✅ Redis connection successful")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down Snabb API")

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Snabb Mobile App - Food & Quick Commerce",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Configure CORS
allow_all = "*" in settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if not allow_all else [],
    allow_origin_regex=".*" if allow_all else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add GZip compression for responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add rate limiting (60 requests per minute per IP)
if settings.RATE_LIMIT_ENABLED:
    app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)

# Register exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(APIError, api_error_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(auth.router)
app.include_router(asks.router)
app.include_router(responses.router)
app.include_router(reviews.router)
app.include_router(messages.router)
app.include_router(users.router)
app.include_router(websockets.router)
app.include_router(payments.router)
app.include_router(notifications.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "cache_enabled": cache_service.enabled
    }
