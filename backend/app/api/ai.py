import logging 
from datetime import datetime
from typing import Optional

import asyncpg
from fastapi import APIRouter,HTTPException,Depends
from app.database.db import get_db
from app.clients.live_status_service import LiveStatusService
from app.GenAI.ai_service import generate_status_summary,extract_search_params,answer_train_question
from pydantic import BaseModel
logger=logging.getLogger(__name__)

live_status_service=LiveStatusService()

router=APIRouter(prefix="/api/ai",tags=["ai"])


class SearchRequest(BaseModel):
    query:str

class AssistantRequest(BaseModel):
    train_id:str
    message:str
    date:Optional[str]=None


@router.post("/search")
async def ai_search(
    body: SearchRequest,
    conn: asyncpg.Connection=Depends(get_db),

):

    params=await extract_search_params(body.query)
    from_name=params.get("from_station")
    to_name=params.get("to_station")

    if not from_name or not to_name:
        return{
            "extracted":params,
            "results":[],
            "caption":"Could not extract both origin and destination from your query.",

        }

    from_row=await conn.fetchrow(
            "SELECT id,code,name FROM stations WHERE name ILIKE $1 OR code ILIKE $1",
            f"%{from_name}%",
        )

    to_row=await conn.fetchrow(
            "SELECT id,code,name FROM stations WHERE name ILIKE $1 OR code ILIKE $1",
            f"%{to_name}%",
        )

    if not from_row or not to_row:
            missing=[]
            if not from_row:
                missing.append("from_station")
            if not to_row:
                missing.append("to_station")

            return{
                "extracted":params,
                "results":[],
                "caption":f"Station(s) not found: {', '.join(missing)}",
            }
    rows = await conn.fetch(
    """
    SELECT DISTINCT t.id, t.number, t.name, t.type
    FROM trains t
    JOIN stop_times st1 ON st1.train_id = t.id
    JOIN stop_times st2 ON st2.train_id = t.id AND st2.sequence > st1.sequence
    WHERE st1.station_id = $1 AND st2.station_id = $2
    """,
    from_row["id"],
    to_row["id"],
    )

    results=[

        {"id":str(r["id"]),"number":r["number"],"name":r["name"],"type":r["type"]}
        for r in rows
    ]

    caption = (
        f"Found {len(results)} train(s) from {from_row['name']} ({from_row['code']}) "
        f"to {to_row['name']} ({to_row['code']})."
        if results
        else f"No trains found from {from_row['name']} to {to_row['name']}."
    )

    return {
        "extracted":params,
        "results":results,
        "caption":caption
    }

@router.post("/assistant")
async def ai_assistant(
    body: AssistantRequest,
    conn: asyncpg.Connection=Depends(get_db),

):
    row=await conn.fetchrow(
        "SELECT id,number,name,type FROM trains WHERE number= $1 OR id::text=$1",
        body.train_id,

    )

    if not row:
        raise HTTPException(status_code=404,detail="Train not found")

    schedule_rows = await conn.fetch(
        """
        SELECT st.sequence, s.code, s.name, st.arrival_time, st.departure_time
        FROM stop_times st
        JOIN stations s ON s.id = st.station_id
        WHERE st.train_id = $1
        ORDER BY st.sequence
        """,
        row["id"],
    )
    
   
    schedule_text = "\n".join(
        f"{r['sequence']}. {r['name']} ({r['code']}) — arr: {r['arrival_time'] or '-'}, dep: {r['departure_time'] or '-'}"
        for r in schedule_rows
    )

    journey_date = body.date or datetime.now().strftime("%Y-%m-%d")
    live_text = ""
    try:
        live = await live_status_service.get_live_status(row["number"], journey_date)
        live_text = (
            f"\nLive: at {live.get('current_station', '?')}, "
            f"next {live.get('next_station', '?')}, "
            f"delay {live.get('delay', 0)} min."
        )
    except RuntimeError:
        live_text = "\nLive data unavailable."

    context=f"Train: {row['name']} ({row['number']})\nSchedule:\n{schedule_text}{live_text}"

    reply=await answer_train_question(context,body.message)
    return {"reply":reply}


