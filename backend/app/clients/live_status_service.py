import logging
import json

from app.clients.where_is_my_train import WhereIsMyTrainClient
from app.clients.irctc_rapid_client import IRCTCRapidClient
from app.redis import redis_client

logger = logging.getLogger(__name__)


class LiveStatusService:
    """
    Composite service for live train status with automatic failover.

    PRIMARY: WhereIsMyTrainClient (free, no key needed)
    FALLBACK: IRCTCRapidClient (free tier, 25 requests/month)

    Both clients return same normalised dict shape::

        {
            "current_station": str | None,
            "next_station":    str | None,
            "delay":           int | None,
            "route":           list[dict],
        }
    """

    CACHE_TTL = 90

    def __init__(self):
        self.primary = WhereIsMyTrainClient()
        self.fallback = IRCTCRapidClient()

    async def get_live_status(self, train_no: str, date: str) -> dict:
        """
        Try the primary source first, use fallback if primary fails. Raises if both fail.
        Redis errors are swallowed so a cache outage never blocks live data.
        """
        cache_key = f"live_status:{train_no}:{date}"

        # --- try cache (non-fatal) ---
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                logger.info("Cache hit for %s", cache_key)
                return json.loads(cached)
            logger.info("Cache miss for %s", cache_key)
        except Exception as redis_err:
            logger.warning("Redis GET failed for %s: %s", cache_key, redis_err)

        # --- primary: WhereIsMyTrain ---
        try:
            result = await self.primary.get_live_status(train_no, date)
            result["source"] = "whereismytrain"
            await self._cache_set(cache_key, result)
            return result
        except Exception as primary_error:
            logger.warning(
                "Primary source (WhereIsMyTrain) failed for train %s: %s",
                train_no, primary_error,
            )

        # --- fallback: IRCTC RapidAPI ---
        try:
            result = await self.fallback.get_live_status(train_no, date)
            result["source"] = "irctc_rapidapi"
            await self._cache_set(cache_key, result)
            return result
        except Exception as fallback_error:
            logger.error(
                "Fallback (IRCTC RapidAPI) also failed for train %s: %s",
                train_no, fallback_error,
            )
            raise RuntimeError(
                f"All live status sources failed for train {train_no}. "
                f"Primary error: {primary_error} | Fallback error: {fallback_error}"
            )

    async def _cache_set(self, key: str, value: dict) -> None:
        """Write to Redis cache; swallow errors so a Redis outage is non-fatal."""
        try:
            await redis_client.set(key, json.dumps(value), ex=self.CACHE_TTL)
        except Exception as e:
            logger.warning("Redis SET failed for %s: %s", key, e)
