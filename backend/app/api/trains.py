import logging
from datetime import date, datetime
from typing import Any, List, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database.db import get_db
from app.models.train import Train
from app.models.livetrainstatus import LiveTrainStatus
from app.models.livestationstop import LiveStationStop
from app.clients.live_status_service import LiveStatusService

logger = logging.getLogger(__name__)

live_status_service = LiveStatusService()

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


@router.get("/{train_id}/live", response_model=LiveTrainStatus)
async def get_live_status(
    train_id: str,
    date: Optional[str] = Query(None, description="Journey date YYYY-MM-DD, defaults to today"),
    conn: asyncpg.Connection = Depends(get_db),
):
    # --- resolve train by number or UUID ---
    row = await conn.fetchrow(
        "SELECT id, number, name, type FROM trains WHERE number = $1 OR id::text = $1",
        train_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Train not found")

    train_number = row["number"]
    journey_date = date or datetime.now().strftime("%Y-%m-%d")

    # --- try live status service (primary + fallback + cache) ---
    try:
        raw = await live_status_service.get_live_status(train_number, journey_date)
        return await _build_live_response(
            raw, str(row["id"]), journey_date, conn
        )
    except RuntimeError:
        logger.warning(
            "All live sources failed for train %s, falling back to static schedule",
            train_number,
        )

    # --- fallback: static schedule from DB ---
    schedule_rows = await conn.fetch(
        """
        SELECT st.sequence, st.arrival_time, st.departure_time, st.platform,
               s.code, s.name
        FROM stop_times st
        JOIN stations s ON s.id = st.station_id
        WHERE st.train_id = $1
        ORDER BY st.sequence
        """,
        row["id"],
    )
    if not schedule_rows:
        raise HTTPException(
            status_code=503,
            detail="Live status unavailable and no schedule data found",
        )

    route = [
        LiveStationStop(
            station_code=r["code"],
            station_name=r["name"],
            sequence=r["sequence"],
            scheduled_arrival=str(r["arrival_time"]) if r["arrival_time"] else None,
            scheduled_departure=str(r["departure_time"]) if r["departure_time"] else None,
        )
        for r in schedule_rows
    ]
    return LiveTrainStatus(
        train_id=str(row["id"]),
        journey_date=datetime.strptime(journey_date, "%Y-%m-%d"),
        route=route,
        source="static_schedule",
    )


async def _build_live_response(
    raw: dict,
    train_id: str,
    journey_date: str,
    conn: asyncpg.Connection,
) -> LiveTrainStatus:
    """Map the normalised dict from LiveStatusService into the LiveTrainStatus model."""

    current_code = raw.get("current_station")
    next_code = raw.get("next_station")

    # Look up lat/lng for current station to derive position
    position = None
    if current_code:
        stn_row = await conn.fetchrow(
            "SELECT lat, lng FROM stations WHERE code = $1", current_code
        )
        if stn_row and stn_row["lat"] is not None and stn_row["lng"] is not None:
            position = {"lat": float(stn_row["lat"]), "lng": float(stn_row["lng"])}

    # Build current / next station stop objects
    current_stop = None
    next_stop = None
    route_stops: list[LiveStationStop] = []

    raw_route = raw.get("route") or []
    for idx, stop in enumerate(raw_route):
        code = stop.get("station_code", "") if isinstance(stop, dict) else str(stop)
        name = stop.get("station_name", "") if isinstance(stop, dict) else ""

        ls = LiveStationStop(
            station_code=code,
            station_name=name,
            sequence=idx + 1,
            scheduled_arrival=stop.get("scheduled_arrival") if isinstance(stop, dict) else None,
            actual_arrival=stop.get("actual_arrival") if isinstance(stop, dict) else None,
            delay_arrival=stop.get("delay_arrival") if isinstance(stop, dict) else None,
            scheduled_departure=stop.get("scheduled_departure") if isinstance(stop, dict) else None,
            actual_departure=stop.get("actual_departure") if isinstance(stop, dict) else None,
            delay_departure=stop.get("delay_departure") if isinstance(stop, dict) else None,
        )
        route_stops.append(ls)

        if code == current_code:
            current_stop = ls
        if code == next_code:
            next_stop = ls

    # Parse delay to int minutes
    delay_minutes = None
    raw_delay = raw.get("delay")
    if raw_delay is not None:
        try:
            delay_minutes = int(raw_delay)
        except (ValueError, TypeError):
            pass

    return LiveTrainStatus(
        train_id=train_id,
        journey_date=datetime.strptime(journey_date, "%Y-%m-%d"),
        current_station=current_stop,
        next_station=next_stop,
        position=position,
        delay_minutes=delay_minutes,
        route=route_stops,
        last_updated=datetime.now(),
        source=raw.get("source"),
    )


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
