"""
Cache Service
Redis-based caching with graceful fallback
"""
import logging
from typing import Optional
from .config import settings

logger = logging.getLogger(__name__)

# Try to import redis, but don't fail if it's not available
try:
    import redis
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available - caching disabled")


class CacheService:
    """Cache service with Redis backend"""
    
    def __init__(self):
        self.redis_client = None
        self.async_redis_client = None
        self.enabled = False
        
        if REDIS_AVAILABLE and settings.REDIS_ENABLED:
            try:
                # Use connection URL for simplified config
                client = redis.from_url(
                    settings.REDIS_URL, 
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                async_client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                # Test connection
                if client.ping():
                    self.redis_client = client
                    self.async_redis_client = async_client
                    self.enabled = True
                    logger.info("Redis cache enabled")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e} - caching disabled")
                self.redis_client = None
                self.async_redis_client = None
                self.enabled = False
    
    def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        if not self.enabled or not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                logger.debug(f"Cache HIT: {key}")
            else:
                logger.debug(f"Cache MISS: {key}")
            return value
        except Exception as e:
            logger.error(f"Cache get error for {key}: {e}")
            return None
    
    def set(self, key: str, value: str, ttl: Optional[int] = None):
        """Set value in cache with optional TTL"""
        if not self.enabled or not self.redis_client:
            return
        
        try:
            if ttl:
                self.redis_client.setex(key, ttl, value)
            else:
                self.redis_client.set(key, value)
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.error(f"Cache set error for {key}: {e}")
    
    def delete(self, key: str):
        """Delete key from cache"""
        if not self.enabled or not self.redis_client:
            return
        
        try:
            self.redis_client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
        except Exception as e:
            logger.error(f"Cache delete error for {key}: {e}")
    
    def delete_pattern(self, pattern: str):
        """Delete all keys matching pattern"""
        if not self.enabled or not self.redis_client:
            return
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
                logger.debug(f"Cache DELETE pattern: {pattern} ({len(keys)} keys)")
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")


# Global cache service instance
cache_service = CacheService()
