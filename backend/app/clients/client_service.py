import httpx
import os
from typing import List


BASE_URL = "https://api.railradar.org/api/v1"

API_KEY=os.getenv("RAILRADAR_API_KEY")

class ClientService:
    def __init__(self):
        self.headers={
            "X-API-Key":API_KEY
        }

    async def get_stations(self) -> List[list]:
        url = f"{BASE_URL}/stations/all-kvs"
        raw = await self._get(url)
        return self._normalize_stations(raw)

    async def get_trains(self) -> List[list]:
        url = f"{BASE_URL}/trains/all-kvs"
        raw = await self._get(url)
        return self._normalize_trains(raw)

    def _normalize_stations(self, raw) -> List[list]:
        """Return list of [code, name] from API response (dict or list)."""
        items = self._extract_list(raw, "data", "stations")
        out = []
        for item in items:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                out.append([str(item[0]), str(item[1])])
            elif isinstance(item, dict):
                code = item.get("code") or item.get("stationCode") or item.get("station_code")
                name = item.get("name") or item.get("stationName") or item.get("station_name")
                if code is not None and name is not None:
                    out.append([str(code), str(name)])
        return out

    def _normalize_trains(self, raw) -> List[list]:
        """Return list of [number, name] from API response (dict or list)."""
        items = self._extract_list(raw, "data", "trains")
        out = []
        for item in items:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                out.append([str(item[0]), str(item[1])])
            elif isinstance(item, dict):
                num = item.get("number") or item.get("trainNumber") or item.get("train_number")
                name = item.get("name") or item.get("trainName") or item.get("train_name")
                if num is not None and name is not None:
                    out.append([str(num), str(name)])
        return out

    @staticmethod
    def _extract_list(raw, *keys) -> list:
        if isinstance(raw, list):
            return raw
        if isinstance(raw, dict):
            for k in keys:
                if k in raw and isinstance(raw[k], list):
                    return raw[k]
            
            for v in raw.values():
                if isinstance(v, list):
                    return v
        return []

    async def _get(self, url: str):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=self.headers)

            if response.status_code == 404:
                raise Exception(
                    "Rail Radar API returned 404 (endpoint not found). "
                    "Check that RAILRADAR_API_KEY is set and valid, and the API base URL is correct. "
                    "For local dev you can use sample data: place stations/trains JSON in backend/scripts/data/ "
                    "and re-run ingest (see scripts/ingest_*.py fallback)."
                )
            if response.status_code != 200:
                raise Exception(
                    f"Rail Radar API Error: {response.status_code} - {response.text[:200]}"
                )

            return response.json()
        

        except httpx.TimeoutException:
            raise Exception("Request to Rail Radar API timed out")

        except httpx.RequestError as e:
            raise Exception(f"Request to Rail Radar API failed: {str(e)}")

