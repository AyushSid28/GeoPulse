from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .livestationtrain import LiveStationTrain


class StationBoard(BaseModel):
    station_code: str = Field(...)
    station_name: str = Field(...)
    hours: str = Field(...)
    trains: list[LiveStationTrain] = Field(...)
    fetched_at: Optional[datetime] = None
