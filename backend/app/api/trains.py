from typing import Any, List, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database.db import get_db
from app.models.train import Train

router = APIRouter(prefix="/api/trains", tags=["trains"])


def row_to_train(row: asyncpg.Record) -> Train:
    return Train(
        id=str(row["id"]),
        number=row["number"],
        name=row["name"],
        type=row["type"],
    )


@router.get("", response_model=List[Train])
async def list_trains(
    number: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    from_station_id: Optional[str] = Query(None),
    to_station_id: Optional[str] = Query(None),
    conn: asyncpg.Connection = Depends(get_db),
):
    if number:
        row = await conn.fetchrow(
            "SELECT id, number, name, type FROM trains WHERE number = $1",
            number,
        )
        return [row_to_train(row)] if row else []
    if name:
        name_pattern = f"%{name}%"
        rows = await conn.fetch(
            "SELECT id, number, name, type FROM trains WHERE name ILIKE $1",
            name_pattern,
        )
        return [row_to_train(r) for r in rows]
    if from_station_id and to_station_id:
        rows = await conn.fetch(
            """
            SELECT DISTINCT t.id, t.number, t.name, t.type
            FROM trains t
            JOIN stop_times st1 ON st1.train_id = t.id
            JOIN stop_times st2 ON st2.train_id = t.id AND st2.sequence > st1.sequence
            JOIN stations s1 ON s1.id = st1.station_id
            JOIN stations s2 ON s2.id = st2.station_id
            WHERE (s1.code = $1 OR s1.id::text = $1)
              AND (s2.code = $2 OR s2.id::text = $2)
            """,
            from_station_id,
            to_station_id,
        )
        return [row_to_train(r) for r in rows]
    rows = await conn.fetch("SELECT id, number, name, type FROM trains")
    return [row_to_train(r) for r in rows]


@router.get("/{train_id}")
async def get_train(
    train_id: str,
    conn: asyncpg.Connection = Depends(get_db),
) -> dict[str, Any]:
    row = await conn.fetchrow(
        "SELECT id, number, name, type FROM trains WHERE number = $1 OR id::text = $1",
        train_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Train not found")
    train = row_to_train(row)
    schedule_rows = await conn.fetch(
        """
        SELECT st.sequence, st.arrival_time, st.departure_time, st.platform, s.code, s.name
        FROM stop_times st
        JOIN stations s ON s.id = st.station_id
        WHERE st.train_id = $1
        ORDER BY st.sequence
        """,
        row["id"],
    )
    schedule = [
        {
            "sequence": r["sequence"],
            "station_code": r["code"],
            "station_name": r["name"],
            "arrival_time": str(r["arrival_time"]) if r["arrival_time"] else None,
            "departure_time": str(r["departure_time"]) if r["departure_time"] else None,
            "platform": r["platform"],
        }
        for r in schedule_rows
    ]
    return {
        "id": train.id,
        "number": train.number,
        "name": train.name,
        "type": train.type,
        "schedule": schedule,
    }


@router.get("/{train_id}/route")
async def get_train_route(
    train_id: str,
    conn: asyncpg.Connection = Depends(get_db),
):
    row = await conn.fetchrow(
        "SELECT rg.train_id, rg.geometry, rg.updated_at FROM route_geometry rg JOIN trains t ON t.id = rg.train_id WHERE t.number = $1 OR t.id::text = $1",
        train_id,
    )
    if not row or not row["geometry"]:
        raise HTTPException(status_code=404, detail="Route not found")
    return {
        "train_id": str(row["train_id"]),
        "geometry": row["geometry"],
        "updated_at": str(row["updated_at"]) if row["updated_at"] else None,
    }
