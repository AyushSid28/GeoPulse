import os
import asyncpg
from typing import Optional

_pool: Optional[asyncpg.Pool] = None


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "")
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return url


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        url = get_database_url()
        if not url:
            raise RuntimeError("DATABASE_URL is not set")
        _pool = await asyncpg.create_pool(url, min_size=1, max_size=5, command_timeout=10)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
