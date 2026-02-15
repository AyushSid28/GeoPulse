import httpx
from datetime import datetime

BASE_URL="https://whereismytrain.in/cache/live_status"

class WhereIsMyTrainClient:

    async def get_live_status(self,train_no:str,date:str)->dict:
        """
         train_no:string train number
         date: YYYY-MM-DD
          

        """ 

        formatted_date=self._format_date(date)

        params={
            "train_no":train_no,
            "date":formatted_date,
            "lang":"en",

        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response=await client.get(BASE_URL,params=params)

            if response.status_code!=200:
                raise RuntimeError(
                    f"Where Is my Train API returned {response.status_code}: {response.text}"
                )

            data=response.json()
            return self._map_response(data)

        except httpx.TimeoutException:
            raise Exception("Request to Where Is My Train API timed out")

        except httpx.RequestError as e:
            raise Exception(f"Request to Where Is My Train API failed: {str(e)}")

        
    def _format_date(self,date:str)->str:
        """
        Convert YYYY-MM-DD to dd-mm-yyyy
        """

        dt=datetime.strptime(date,"%Y-%m-%d")
        return dt.strftime("%d-%m-%Y")

    def _map_response(self,data:dict)->dict:
        """
        Normalize the WhereIsMyTrain API response to internal live-status shape.

        Known API keys (from whereismytrain.in/cache/live_status):
          curStn / current_station   – current station code
          pitstop_next_to_curstn     – dict with next station info
          days_schedule / route      – list of stop dicts
          delay / delay_in_arrival   – delay value
        """
        # Current station — try API-specific key first, then generic
        current_station = (
            data.get("curStn")
            or data.get("current_station")
            or data.get("cur_stn")
        )

        # Next station — nested dict or flat key
        next_stn_obj = data.get("pitstop_next_to_curstn") or {}
        next_station = (
            next_stn_obj.get("station_code")
            if isinstance(next_stn_obj, dict) else None
        ) or data.get("next_station")

        # Delay
        delay = data.get("delay") or data.get("delay_in_arrival")

        # Route — map from days_schedule (actual API) or route (generic)
        raw_route = data.get("days_schedule") or data.get("route") or []
        route = []
        for stop in raw_route:
            if not isinstance(stop, dict):
                continue
            route.append({
                "station_code": stop.get("station_code") or stop.get("stationCode") or "",
                "station_name": stop.get("station_name") or stop.get("stationName") or "",
                "scheduled_arrival": stop.get("sch_arrival") or stop.get("scheduled_arrival"),
                "actual_arrival": stop.get("act_arrival") or stop.get("actual_arrival"),
                "delay_arrival": stop.get("delay_in_arrival") or stop.get("delay_arrival"),
                "scheduled_departure": stop.get("sch_departure") or stop.get("scheduled_departure"),
                "actual_departure": stop.get("act_departure") or stop.get("actual_departure"),
                "delay_departure": stop.get("delay_in_departure") or stop.get("delay_departure"),
                "platform": stop.get("platform"),
                "is_departed": stop.get("has_departed") or stop.get("is_departed"),
            })

        return {
            "current_station": current_station,
            "next_station": next_station,
            "delay": delay,
            "route": route,
        }
