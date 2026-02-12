from typing import List, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database.db import get_db
from app.models.station import Station

router = APIRouter(prefix="/api/stations", tags=["stations"])


def row_to_station(row: asyncpg.Record) -> Station:
    return Station(
        id=str(row["id"]),
        code=row["code"],
        name=row["name"],
        lat=row["lat"],
        lng=row["lng"],
        zone=row["zone"],
    )


@router.get("", response_model=List[Station])
async def list_stations(
    q: Optional[str] = Query(None),
    conn: asyncpg.Connection = Depends(get_db),
):
    if q:
        q = f"%{q}%"
        rows = await conn.fetch(
            "SELECT id, code, name, lat, lng, zone FROM stations WHERE name ILIKE $1 OR code ILIKE $1",
            q,
        )
    else:
        rows = await conn.fetch("SELECT id, code, name, lat, lng, zone FROM stations")
    return [row_to_station(r) for r in rows]


@router.get("/{station_id}", response_model=Station)
async def get_station(
    station_id: str,
    conn: asyncpg.Connection = Depends(get_db),
):
    row = await conn.fetchrow(
        "SELECT id, code, name, lat, lng, zone FROM stations WHERE code = $1 OR id::text = $1",
        station_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Station not found")
    return row_to_station(row)
