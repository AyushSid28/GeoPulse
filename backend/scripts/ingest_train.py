import asyncio
import json
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.clients.client_service import ClientService
from app.database.db import get_pool

DATA_DIR = Path(__file__).resolve().parent / "data"
LOCAL_TRAINS_JSON = DATA_DIR / "trains.json"


async def _fetch_trains():
    """Fetch trains from API or local JSON fallback."""
    try:
        client = ClientService()
        return await client.get_trains()
    except Exception as e:
        if LOCAL_TRAINS_JSON.exists():
            print(f"API failed ({e}). Using local data from {LOCAL_TRAINS_JSON}")
            with open(LOCAL_TRAINS_JSON) as f:
                return json.load(f)
        raise RuntimeError(
            f"Rail Radar API failed and no local fallback found. {e} "
            f"Add {LOCAL_TRAINS_JSON} with format [[number, name], ...] for dev."
        ) from e


async def ingest():
    trains = await _fetch_trains()
    pool = await get_pool()

    async with pool.acquire() as conn:
        for number, name in trains:
            await conn.execute(
                """
                INSERT INTO trains (id, number, name, type)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (number) DO UPDATE SET name = EXCLUDED.name
                """,
                uuid.uuid4(),
                number,
                name,
                None,
            )

    print(f"Ingested {len(trains)} trains")


if __name__ == "__main__":
    asyncio.run(ingest())