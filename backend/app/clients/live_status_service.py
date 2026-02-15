import logging
import json
from app.clients.where_is_my_train import WhereIsMyTrainClient
from app.clients.irctc_rapid_client import IRCTCRapidClient
from app.redis import redis_client

logger=logging.getLogger(__name__)

class LiveStatusService:

    CACHE_TTL=90

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

    def __init__(self):
        self.primary=WhereIsMyTrainClient()
        self.fallback=IRCTCRapidClient()

    async def get_live_status(self,train_no:str,date:str)->dict:
        """
        Try the primary source first, use fallback if primary fails,Raises if both fail.
        """
        cache_key=f"live_status:{train_no}:{date}"
        

        cached=await redis_client.get(cache_key)
        if cached:
            logger.info("Cache hit for %s",cache_key)
            return json.loads(cached)
        
        logger.info("Cache miss for %s",cache_key)

        try:
            result=await self.primary.get_live_status(train_no,date)
            result["source"]="whereismytrain"

            await redis_client.set(cache_key,json.dumps(result),ex=self.CACHE_TTL)


            return result

        except Exception as primary_error:
            logger.warning("Primary source (WhereIsMyTrain) failed for train %s : %s",
            train_no,primary_error)


        try:
            result=await self.fallback.get_live_status(train_no,date)
            result["source"]="irctc_rapidapi"

            await redis_client.set(cache_key,json.dumps(result),ex=self.CACHE_TTL)
            return result

        except Exception as fallback_error:
            logger.error("Fallback (IRCTC Rapid API) also failed for train %s : %s",
            train_no,fallback_error)
          
            raise RuntimeError(
              f"All live status sources failed for train {train_no}. "
              f"Primary error: {primary_error} | Fallback error: {fallback_error}"
            )