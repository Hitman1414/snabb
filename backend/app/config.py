"""
Environment configuration using Pydantic Settings.
Supports loading from .env file and environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # ─── Application ───────────────────────────────────────────────────────
    APP_NAME: str = "Snabb API"
    APP_VERSION: str = "1.0.0"
    # IMPORTANT: DEBUG=True triggers Base.metadata.create_all() in main.py.
    # Never enable against a production Postgres instance — schema drift
    # between SQLAlchemy models and Alembic-applied state will silently
    # alter the live database (audit issue #2).
    DEBUG: bool = False

    # ─── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./snabb.db"
    DB_ECHO: bool = False

    # ─── Redis Cache ───────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False
    CACHE_TTL: int = 300

    # ─── Security / Auth (audit #11) ───────────────────────────────────────
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    # Default shortened from 30 days → 60 minutes. Combined with the JWT
    # blocklist (auth.py) this gives revocation-on-logout semantics.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ─── CORS (audit #5) ───────────────────────────────────────────────────
    # Pydantic-settings parses JSON arrays from env. We default to a safe
    # localhost list; production must override with explicit origins.
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
    ]

    # ─── Image CDN & Storage ───────────────────────────────────────────────
    STORAGE_PROVIDER: str = "local"  # local or s3
    IMAGE_CDN_URL: Optional[str] = None
    MAX_IMAGE_SIZE: int = 5 * 1024 * 1024  # bytes (legacy name)
    MAX_IMAGE_SIZE_MB: int = 5             # audit #13
    MAX_IMAGES_PER_ASK: int = 5            # audit #13

    # AWS S3 Settings
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION_NAME: str = "us-east-1"
    AWS_BUCKET_NAME: str = "snabb-uploads-bucket"

    # ─── Pagination ────────────────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # ─── Sentry (audit #19) ────────────────────────────────────────────────
    SENTRY_DSN: Optional[str] = None
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1   # 10% by default in prod
    SENTRY_PROFILES_SAMPLE_RATE: float = 0.1

    # ─── AI ────────────────────────────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # ─── Rate Limiting (audit #18) ─────────────────────────────────────────
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    # Tighter, separate limit for auth endpoints (login/register/forgot/reset).
    RATE_LIMIT_AUTH_PER_MINUTE: int = 5

    # ─── Email / OTP (audit #6) ────────────────────────────────────────────
    # When RESEND_API_KEY is unset, OTPs are printed to logs (dev fallback).
    RESEND_API_KEY: Optional[str] = None
    OTP_FROM_EMAIL: str = "Snabb <onboarding@resend.dev>"

    # ─── Stripe / Payments (audit #3, #10) ─────────────────────────────────
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLIC_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    CURRENCY: str = "usd"
    # "manual" = authorize only (escrow). "automatic" = capture immediately.
    PAYMENTS_CAPTURE_METHOD: str = "manual"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()
