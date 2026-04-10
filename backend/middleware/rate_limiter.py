"""Rate limiter dependency for FastAPI using Redis."""

import time
import logging
from fastapi import HTTPException, Request
from services.redis_client import redis_client

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter dependency."""
    
    def __init__(self, times: int = 10, seconds: int = 60):
        """
        :param times: Number of requests allowed
        :param seconds: Time window in seconds
        """
        self.times = times
        self.seconds = seconds

    def __call__(self, request: Request):
        try:
            # Get client IP
            client_ip = request.client.host if request.client else "unknown"
            
            # Create a unique key per route and IP
            key = f"rate_limit:{client_ip}:{request.url.path}"
            
            # Simple sliding window rate limit simulation
            current_time = int(time.time())
            window_start = current_time - self.seconds
            
            # Use Redis pipeline for atomic operations
            if redis_client.redis:
                pipeline = redis_client.redis.pipeline()
                # Remove old entries
                pipeline.zremrangebyscore(key, 0, window_start)
                # Add current request
                pipeline.zadd(key, {str(current_time): current_time})
                # Count queries in window
                pipeline.zcard(key)
                # Set expire on the key so it doesn't leak memory forever
                pipeline.expire(key, self.seconds)
                
                results = pipeline.execute()
                request_count = results[2]
                
                if request_count > self.times:
                    logger.warning(f"Rate limit exceeded for {client_ip} on {request.url.path}")
                    raise HTTPException(
                        status_code=429,
                        detail="Too many requests. Please try again later."
                    )
        except HTTPException:
            raise
        except Exception as e:
            # If Redis fails, log it but don't fail the request
            logger.error(f"Rate Limiter Error: {e}")
            
        return True
