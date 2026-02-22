import logging
from datetime import datetime
from typing import Optional
from uuid import uuid4

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.database.db import get_db
from app.clients.live_status_service import LiveStatusService

logger = logging.getLogger(__name__)

live_status_service = LiveStatusService()

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertCreate(BaseModel):
    train_id: str
    user_id: str
    station_id: str
    minutes_before: int = 10


@router.post("")
async def create_alert(
    body: AlertCreate,
    conn: asyncpg.Connection = Depends(get_db),
):
    train = await conn.fetchrow(
        "SELECT id FROM trains WHERE id::text = $1 OR number = $1", body.train_id
    )
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    station = await conn.fetchrow(
        "SELECT id FROM stations WHERE id::text = $1 OR code = $1", body.station_id
    )
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    alert_id = uuid4()

    await conn.execute(
        """
        INSERT INTO alerts (id, train_id, user_id, type, station_id, minutes_before, triggered)
        VALUES ($1, $2, $3, 'before_station', $4, $5, FALSE)
        """,
        alert_id, train["id"], body.user_id, station["id"], body.minutes_before,
    )

    return {
        "id": str(alert_id),
        "train_id": str(train["id"]),
        "user_id": body.user_id,
        "type": "before_station",
        "station_id": str(station["id"]),
        "minutes_before": body.minutes_before,
        "triggered": False,
    }


@router.get("")
async def list_alerts(
    user_id: str = Query(...),
    train_id: Optional[str] = Query(None),
    conn: asyncpg.Connection = Depends(get_db),
):
    if train_id:
        rows = await conn.fetch(
            """
            SELECT a.id, a.train_id, a.user_id, a.type, a.station_id,
                   a.minutes_before, a.triggered, a.created_at,
                   t.number as train_number, s.code as station_code, s.name as station_name
            FROM alerts a
            JOIN trains t ON t.id = a.train_id
            JOIN stations s ON s.id = a.station_id
            WHERE a.user_id = $1 AND (t.number = $2 OR t.id::text = $2)
            ORDER BY a.created_at DESC
            """,
            user_id, train_id,
        )
    else:
        rows = await conn.fetch(
            """
            SELECT a.id, a.train_id, a.user_id, a.type, a.station_id,
                   a.minutes_before, a.triggered, a.created_at,
                   t.number as train_number, s.code as station_code, s.name as station_name
            FROM alerts a
            JOIN trains t ON t.id = a.train_id
            JOIN stations s ON s.id = a.station_id
            WHERE a.user_id = $1
            ORDER BY a.created_at DESC
            """,
            user_id,
        )

    alerts = []
    for r in rows:
        triggered = r["triggered"]

        if not triggered:
            try:
                live = await live_status_service.get_live_status(
                    r["train_number"], datetime.now().strftime("%Y-%m-%d")
                )
                next_station = live.get("next_station")
                if next_station and next_station == r["station_code"]:
                    delay = live.get("delay")
                    if delay is not None and int(delay) <= r["minutes_before"]:
                        triggered = True
                        await conn.execute(
                            "UPDATE alerts SET triggered = TRUE WHERE id = $1", r["id"]
                        )
            except Exception:
                pass

        alerts.append({
            "id": str(r["id"]),
            "train_id": str(r["train_id"]),
            "train_number": r["train_number"],
            "user_id": r["user_id"],
            "type": r["type"],
            "station_id": str(r["station_id"]),
            "station_code": r["station_code"],
            "station_name": r["station_name"],
            "minutes_before": r["minutes_before"],
            "triggered": triggered,
            "created_at": str(r["created_at"]),
        })

    return alerts
