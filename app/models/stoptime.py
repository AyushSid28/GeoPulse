from typing import Optional
from pydantic import BaseModel, Field


class StopTime(BaseModel):
    id: str = Field(...)
    train_id: str = Field(...)
    station_id: str = Field(...)
    sequence: int = Field(...)
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None
    distance: Optional[float] = None
    platform: Optional[str] = None
