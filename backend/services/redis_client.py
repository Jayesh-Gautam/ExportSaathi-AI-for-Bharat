"""Redis client setup for caching, session management, and rate limiting."""

import logging
from typing import Optional
import redis

from config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    """Synchronous Redis client wrapper."""

    def __init__(self):
        self.redis: Optional[redis.Redis] = None
        self.url = settings.REDIS_URL
        self._connect()

    def _connect(self):
        """Initialize Redis connection."""
        if not self.redis:
            try:
                self.redis = redis.from_url(
                    self.url,
                    decode_responses=True,
                    health_check_interval=30
                )
                # Test connection
                self.redis.ping()
                logger.info(f"Successfully connected to Redis at {self.url}")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self.redis = None

    def get(self, key: str) -> Optional[str]:
        """Get value from Redis."""
        if not self.redis:
            return None
        try:
            return self.redis.get(key)
        except Exception as e:
            logger.error(f"Redis get failed: {e}")
            return None

    def set(self, key: str, value: str, expire: int = 3600):
        """Set value in Redis with expiration (default 1 hour)."""
        if not self.redis:
            return None
        try:
            return self.redis.set(key, value, ex=expire)
        except Exception as e:
            logger.error(f"Redis set failed: {e}")
            return None
            
    def delete(self, key: str):
        """Delete key from Redis."""
        if not self.redis:
            return None
        try:
            return self.redis.delete(key)
        except Exception as e:
            logger.error(f"Redis delete failed: {e}")
            return None

# Singleton instance
redis_client = RedisClient()
