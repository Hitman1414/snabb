import time
import json
import logging
import asyncio
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from ..cache import cache_service

logger = logging.getLogger(__name__)

class MonitoringMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Skip monitoring for health check and static files to avoid noise
        if request.url.path in ["/health", "/"] or request.url.path.startswith("/static"):
            return await call_next(request)
            
        # Increment total requests counter
        if cache_service.enabled and cache_service.async_redis_client:
            try:
                await cache_service.async_redis_client.incr("stats:total_requests")
            except Exception as e:
                logger.error(f"Monitoring error (total_requests): {e}")
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        
        if cache_service.enabled and cache_service.async_redis_client:
            try:
                status_code = response.status_code
                
                # We can run these in parallel to reduce latency
                redis = cache_service.async_redis_client
                endpoint = f"{request.method} {request.url.path}"
                user_agent = request.headers.get("User-Agent", "").lower()
                platform = "mobile" if any(x in user_agent for x in ["okhttp", "expo", "cfnetwork", "darwin", "ios", "android"]) else "browser"
                
                request_data = {
                    "method": request.method,
                    "path": request.url.path,
                    "status": status_code,
                    "duration": round(process_time, 4),
                    "timestamp": time.time(),
                    "platform": platform
                }

                await asyncio.gather(
                    redis.hincrby("stats:status_codes", str(status_code), 1),
                    redis.hincrby("stats:endpoint_hits", endpoint, 1),
                    redis.hincrby("stats:platforms", platform, 1),
                    redis.lpush("stats:recent_requests", json.dumps(request_data)),
                    redis.ltrim("stats:recent_requests", 0, 49),
                    redis.lpush("stats:response_times", process_time),
                    redis.ltrim("stats:response_times", 0, 99)
                )
                
            except Exception as e:
                logger.error(f"Monitoring error (updating stats): {e}")
            
        return response
