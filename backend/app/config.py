"""
Environment configuration using Pydantic Settings.
Supports loading from .env file and environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    APP_NAME: str = "Snabb API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:///./snabb.db"
    DB_ECHO: bool = False
    
    # Redis Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False  # Set to True when Redis is available
    CACHE_TTL: int = 300  # 5 minutes default
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    # Image CDN & Storage
    STORAGE_PROVIDER: str = "local" # local or s3
    IMAGE_CDN_URL: Optional[str] = None
    MAX_IMAGE_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    # AWS S3 Settings (Storage Provider)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION_NAME: str = "us-east-1"
    AWS_BUCKET_NAME: str = "snabb-uploads-bucket"
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Sentry
    SENTRY_DSN: Optional[str] = None
    SENTRY_ENVIRONMENT: str = "development"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = False
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLIC_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    CURRENCY: str = "usd"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()
