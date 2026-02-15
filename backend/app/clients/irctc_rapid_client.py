import os
from datetime import datetime

import httpx

BASE_URL = "https://irctc1.p.rapidapi.com/api/v1/liveTrainStatus"
RAPIDAPI_HOST = "irctc1.p.rapidapi.com"


class IRCTCRapidClient:
    """
    Fallback client for live train status using IRCTC API on RapidAPI.
    Free tier: 25 requests/month – used only when WhereIsMyTrain is down.

    Sign up at https://rapidapi.com/IRCTCAPI/api/irctc1 to get an API key,
    then set IRCTC_RAPIDAPI_KEY in your environment.
    """

    def __init__(self):
        self.api_key = os.getenv("IRCTC_RAPIDAPI_KEY", "")

    async def get_live_status(self, train_no: str, date: str) -> dict:
        """
        train_no: train number (e.g. "12301")
        date: YYYY-MM-DD
        """
        if not self.api_key:
            raise RuntimeError(
                "IRCTC_RAPIDAPI_KEY is not set. "
                "Sign up at https://rapidapi.com/IRCTCAPI/api/irctc1 for a free key."
            )

        start_day = self._calc_start_day(date)

        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
        }

        params = {
            "trainNo": train_no,
            "startDay": str(start_day),
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(BASE_URL, headers=headers, params=params)

            if response.status_code != 200:
                raise RuntimeError(
                    f"IRCTC RapidAPI returned {response.status_code}: {response.text}"
                )

            data = response.json()
            return self._map_response(data)

        except httpx.TimeoutException:
            raise Exception("Request to IRCTC RapidAPI timed out")

        except httpx.RequestError as e:
            raise Exception(f"Request to IRCTC RapidAPI failed: {str(e)}")

    @staticmethod
    def _calc_start_day(date: str) -> int:
        """
        IRCTC API uses startDay: 0 = today, 1 = yesterday, etc.
        Convert YYYY-MM-DD to the offset from today.
        """
        journey = datetime.strptime(date, "%Y-%m-%d").date()
        today = datetime.now().date()
        delta = (today - journey).days
        return max(delta, 0)

    @staticmethod
    def _map_response(data: dict) -> dict:
        """
        Normalize IRCTC RapidAPI response to the same internal shape
        as WhereIsMyTrainClient.
        """
        body = data.get("data") or data

        current_station = body.get("current_station_code") or body.get("CurrentStation")
        next_station = None
        delay = body.get("delay") or body.get("Delay")

        # Build route from TrainRoute array
        train_route = body.get("train_route") or body.get("TrainRoute") or []
        route = []
        found_current = False

        for stop in train_route:
            station_code = stop.get("station_code") or stop.get("stationCode") or ""
            station_name = stop.get("station_name") or stop.get("stationName") or ""

            entry = {
                "station_code": station_code,
                "station_name": station_name,
                "scheduled_arrival": stop.get("schArr") or stop.get("scheduled_arrival"),
                "actual_arrival": stop.get("actArr") or stop.get("actual_arrival"),
                "delay_arrival": stop.get("delayArr") or stop.get("delay_arrival"),
                "scheduled_departure": stop.get("schDep") or stop.get("scheduled_departure"),
                "actual_departure": stop.get("actDep") or stop.get("actual_departure"),
                "delay_departure": stop.get("delayDep") or stop.get("delay_departure"),
            }
            route.append(entry)

            # Determine next station (first stop after current)
            if found_current and next_station is None:
                next_station = station_code
            if station_code == current_station:
                found_current = True

        return {
            "current_station": current_station,
            "next_station": next_station,
            "delay": delay,
            "route": route,
        }
