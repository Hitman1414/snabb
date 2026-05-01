from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging
from .database import engine, Base
from .routers import auth, asks, responses, reviews, messages, users, websockets, payments, notifications, admin, ai
from .config import settings
from .cache import cache_service
from .middleware import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
    api_error_handler,
    APIError,
    RateLimitMiddleware,
    MonitoringMiddleware,
)
from .websocket_manager import manager
import asyncio
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import sentry_sdk

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Sentry — sample rates driven by env (audit #19).
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        profiles_sample_rate=settings.SENTRY_PROFILES_SAMPLE_RATE,
    )

# Auto-create tables ONLY in DEBUG mode AND only against SQLite.
# This is a hard guard against the audit #2 risk of altering a Postgres
# schema by accident: even if someone sets DEBUG=True with DATABASE_URL
# pointing at Postgres, we refuse to run create_all().
if settings.DEBUG:
    if settings.DATABASE_URL.startswith("sqlite"):
        logger.info("🔧 Debug mode + SQLite: auto-creating tables")
        Base.metadata.create_all(bind=engine)
    else:
        logger.warning(
            "⚠️ DEBUG=True but DATABASE_URL is not SQLite — refusing to run "
            "create_all() to protect remote schemas. Use Alembic for migrations."
        )
else:
    logger.info("🚀 Production mode: schema managed by Alembic (`alembic upgrade head`)")

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
    logger.info(f"🌐 CORS allowed origins: {settings.CORS_ORIGINS}")

    ws_listener_task = None
    if cache_service.enabled:
        logger.info("✅ Redis connection successful")
        ws_listener_task = asyncio.create_task(manager.listen_to_redis())

    yield

    if ws_listener_task:
        ws_listener_task.cancel()

    # Shutdown
    logger.info("👋 Shutting down Snabb API")

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Snabb Mobile App - Food & Quick Commerce",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)

# ─── CORS (audit #5) ─────────────────────────────────────────────────────
# Wildcard "*" + allow_credentials=True is rejected by browsers and is a
# CSRF/credential-leak vector. We enforce an explicit allowlist.
if "*" in settings.CORS_ORIGINS:
    logger.warning(
        "⚠️ CORS_ORIGINS contains '*'. This is unsafe with cookie auth. "
        "Replace with explicit origins."
    )
    # Strip the wildcard to fail-safe: nothing outside the explicit list passes.
    cors_origins = [o for o in settings.CORS_ORIGINS if o != "*"]
else:
    cors_origins = settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Client-Platform"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add GZip compression for responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add rate limiting (60 requests per minute per IP)
if settings.RATE_LIMIT_ENABLED:
    app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)

# Add monitoring middleware
app.add_middleware(MonitoringMiddleware)

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
app.include_router(ai.router)

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
