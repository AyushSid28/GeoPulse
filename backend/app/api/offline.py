import logging

import asyncpg
from fastapi import APIRouter, Depends

from app.database.db import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/offline", tags=["offline"])


@router.get("/bundle")
async def get_offline_bundle(
    conn: asyncpg.Connection = Depends(get_db),
):
    stations_rows = await conn.fetch("SELECT id, code, name, lat, lng FROM stations")
    train_rows = await conn.fetch("SELECT id, number, name, type FROM trains")
    geo_rows = await conn.fetch("SELECT train_id, geometry FROM route_geometry")

    stations = [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "code": r["code"],
            "lat": float(r["lat"]) if r["lat"] is not None else None,
            "lng": float(r["lng"]) if r["lng"] is not None else None,
        }
        for r in stations_rows
    ]

    trains = [
        {
            "id": str(r["id"]),
            "number": r["number"],
            "name": r["name"],
            "type": r["type"],
        }
        for r in train_rows
    ]

    route_geometries = [
        {"train_id": str(r["train_id"]), "geometry": r["geometry"]}
        for r in geo_rows
        if r["geometry"]
    ]

    return {
        "stations": stations,
        "trains": trains,
        "route_geometries": route_geometries,
    }