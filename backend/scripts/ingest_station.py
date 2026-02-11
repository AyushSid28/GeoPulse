import asyncio
import json
import sys
import uuid
from pathlib import Path

# Add backend root so "app" is importable when run as: python scripts/ingest_station.py
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.clients.client_service import ClientService
from app.database.db import get_pool

DATA_DIR = Path(__file__).resolve().parent / "data"
LOCAL_STATIONS_JSON = DATA_DIR / "stations.json"


async def _fetch_stations():
    """Fetch stations from API or local JSON fallback."""
    try:
        client = ClientService()
        return await client.get_stations()
    except Exception as e:
        if LOCAL_STATIONS_JSON.exists():
            print(f"API failed ({e}). Using local data from {LOCAL_STATIONS_JSON}")
            with open(LOCAL_STATIONS_JSON) as f:
                return json.load(f)
        raise RuntimeError(
            f"Rail Radar API failed and no local fallback found. {e} "
            f"Add {LOCAL_STATIONS_JSON} with format [[code, name], ...] for dev."
        ) from e


async def ingest():
    stations = await _fetch_stations()
    pool = await get_pool()

    async with pool.acquire() as conn:
        for code, name in stations:
            await conn.execute(
                """
                INSERT INTO stations (id, code, name, lat, lng, zone)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                """,
                uuid.uuid4(),
                code,
                name,
                None,
                None,
                None,
            )

    print(f"Ingested {len(stations)} stations")


if __name__ == "__main__":
    asyncio.run(ingest())
