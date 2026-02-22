import json
import logging
from datetime import date

from app.GenAI.config import get_groq_client
from app.redis import redis_client

logger = logging.getLogger(__name__)

MODEL = "llama-3.3-70b-versatile"
SUMMARY_TTL = 90


async def generate_status_summary(live_data: dict) -> str:
    train_no = live_data.get("train_no", "unknown")
    cache_key = f"ai_summary:{train_no}:{date.today().isoformat()}"

    try:
        cached = await redis_client.get(cache_key)
        if cached:
            return cached
    except Exception as e:
        logger.warning("Redis GET failed for %s: %s", cache_key, e)

    prompt = (
        "You are a train status assistant. Summarise this for a passenger in 1-2 sentences. "
        "Be concise and helpful.\n"
        f"Train is at {live_data.get('current_station', 'N/A')}, "
        f"next stop {live_data.get('next_station', 'N/A')}, "
        f"delay {live_data.get('delay', 0)} min."
    )

    try:
        client = get_groq_client()
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=150,
        )
        summary = resp.choices[0].message.content.strip()
        try:
            await redis_client.set(cache_key, summary, ex=SUMMARY_TTL)
        except Exception as e:
            logger.warning("Redis SET failed for %s: %s", cache_key, e)
        return summary
    except Exception as e:
        logger.error("Groq Summary failed: %s", e)
        return "Live Summary unavailable"


async def extract_search_params(query: str) -> dict:
    prompt = (
        "Extract from_station, to_station, and date (if mentioned) from this query. "
        "Return JSON only with keys: from_station, to_station, date. "
        "If a field is not mentioned, set it to null.\n"
        f'Query: "{query}"'
    )

    try:
        client = get_groq_client()
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=150,
        )
        raw = resp.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(raw)
    except Exception as e:
        logger.error("Groq param extraction failed: %s", e)
        return {"from_station": None, "to_station": None, "date": None}


async def answer_train_question(train_context: str, question: str) -> str:
    prompt = (
        "You are a train assistant. Answer using ONLY the provided data. Be brief.\n"
        f"Context: {train_context}\n"
        f"Question: {question}"
    )

    try:
        client = get_groq_client()
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.error("Groq question answering failed: %s", e)
        return "Unable to answer right now"
