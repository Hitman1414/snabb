"""
Rate Limiting Middleware
Uses Redis for distributed rate limiting across workers.

Audit #18: auth endpoints get a tighter, separate budget so credential
stuffing on /auth/login can't burn through the general 60 req/min limit.
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import logging
import time
from ..cache import cache_service
from ..config import settings

logger = logging.getLogger(__name__)


# Sensitive paths get the auth-specific budget. Prefix match so any future
# /auth/* additions inherit the tighter limit by default.
_AUTH_PATH_PREFIXES = ("/auth/login", "/auth/register", "/auth/forgot-password",
                       "/auth/reset-password", "/auth/send-otp", "/auth/verify-otp")


def _is_auth_path(path: str) -> bool:
    return any(path.startswith(p) for p in _AUTH_PATH_PREFIXES)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Distributed rate limiting middleware using Redis."""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.auth_requests_per_minute = settings.RATE_LIMIT_AUTH_PER_MINUTE
        # Fallback for when Redis is unavailable. Two separate buckets so a
        # noisy general client can't push an attacker over the auth budget
        # (or vice versa).
        self.local_requests = defaultdict(list)
        self.local_auth_requests = defaultdict(list)
        self.last_cleanup = time.time()

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for low-risk meta routes.
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)

        is_auth = _is_auth_path(request.url.path)
        limit = self.auth_requests_per_minute if is_auth else self.requests_per_minute
        bucket_label = "auth" if is_auth else "general"

        client_ip = request.client.host if request.client else "unknown"

        # ─── Redis path ────────────────────────────────────────────────
        if cache_service.enabled and cache_service.async_redis_client:
            try:
                redis = cache_service.async_redis_client
                key = f"ratelimit:{bucket_label}:{client_ip}"

                current = await redis.incr(key)
                if current == 1:
                    await redis.expire(key, 60)

                if current > limit:
                    logger.warning(
                        f"Rate limit exceeded for {client_ip} on {bucket_label} "
                        f"bucket ({current}/{limit})"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded. Please try again later.",
                    )

                response = await call_next(request)
                response.headers["X-RateLimit-Limit"] = str(limit)
                response.headers["X-RateLimit-Remaining"] = str(max(0, limit - current))
                return response

            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Redis rate limiting failed, falling back to local: {e}")

        # ─── In-process fallback ───────────────────────────────────────
        now = time.time()
        if now - self.last_cleanup > 60:
            self._cleanup(now)

        minute_ago = now - 60
        bucket = self.local_auth_requests if is_auth else self.local_requests
        bucket[client_ip] = [t for t in bucket[client_ip] if t > minute_ago]

        if len(bucket[client_ip]) >= limit:
            logger.warning(f"Rate limit exceeded for {client_ip} on {bucket_label} (local)")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )

        bucket[client_ip].append(now)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(limit - len(bucket[client_ip]))
        return response

    def _cleanup(self, now: float):
        """Remove old entries from both fallback buckets."""
        minute_ago = now - 60
        for store in (self.local_requests, self.local_auth_requests):
            for ip in list(store.keys()):
                store[ip] = [t for t in store[ip] if t > minute_ago]
                if not store[ip]:
                    del store[ip]
        self.last_cleanup = now
