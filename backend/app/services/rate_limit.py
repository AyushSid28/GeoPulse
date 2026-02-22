import logging

from fastapi import HTTPException, Request

from app.redis import redis_client

logger = logging.getLogger(__name__)

MAX_REQUESTS = 60
WINDOW_SECONDS = 60


async def rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{ip}:live"

    try:
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, WINDOW_SECONDS)
        if count > MAX_REQUESTS:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Rate limit check failed (Redis): %s", e)