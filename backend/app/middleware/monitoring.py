import time
import json
import logging
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
        if cache_service.enabled:
            try:
                cache_service.redis_client.incr("stats:total_requests")
            except Exception as e:
                logger.error(f"Monitoring error (total_requests): {e}")
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        
        if cache_service.enabled:
            try:
                status_code = response.status_code
                
                # Increment status code counter
                cache_service.redis_client.hincrby("stats:status_codes", str(status_code), 1)
                
                # Track endpoint hits
                endpoint = f"{request.method} {request.url.path}"
                cache_service.redis_client.hincrby("stats:endpoint_hits", endpoint, 1)
                
                # Store recent requests (last 50)
                request_data = {
                    "method": request.method,
                    "path": request.url.path,
                    "status": status_code,
                    "duration": round(process_time, 4),
                    "timestamp": time.time()
                }
                cache_service.redis_client.lpush("stats:recent_requests", json.dumps(request_data))
                cache_service.redis_client.ltrim("stats:recent_requests", 0, 49)
                
                # Track average response time
                cache_service.redis_client.lpush("stats:response_times", process_time)
                cache_service.redis_client.ltrim("stats:response_times", 0, 99)
                
            except Exception as e:
                logger.error(f"Monitoring error (updating stats): {e}")
            
        return response
