"""
Create database tables (stations, trains, stop_times, route_geometry).
Run once before ingest_station.py and ingest_train.py.

  python scripts/init_db.py
"""
import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.database.db import get_pool, close_pool

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "app" / "database" / "station.sql"


async def init_db():
    sql = SCHEMA_PATH.read_text()
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Run each statement; ignore "already exists" so script is idempotent
        for stmt in _split_sql(sql):
            stmt = stmt.strip()
            if not stmt:
                continue
            try:
                await conn.execute(stmt)
                print(f"OK: {stmt[:60].replace(chr(10), ' ')}...")
            except Exception as e:
                if "already exists" in str(e):
                    print(f"Skip (exists): {stmt[:50]}...")
                else:
                    raise
    await close_pool()
    print("Database schema ready.")


def _split_sql(sql: str) -> list[str]:
    """Split SQL into single statements (by semicolon), keep constraint blocks intact."""
    statements = []
    current = []
    for line in sql.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        current.append(line)
        if stripped.endswith(";"):
            statements.append("\n".join(current))
            current = []
    if current:
        statements.append("\n".join(current))
    return statements


if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())
