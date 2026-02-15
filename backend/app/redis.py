import os
import logging

from dotenv import load_dotenv
import redis.asyncio as redis

load_dotenv()
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL")

if not REDIS_URL:
    raise ValueError(
        "REDIS_URL environment variable is not set. "
        "Add it to your .env file, e.g. REDIS_URL=redis://localhost:6379/0"
    )

redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True,
)


async def get_redis_client():
    return redis_client
