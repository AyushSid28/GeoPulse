from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from .livestationstop import LiveStationStop


class LiveTrainStatus(BaseModel):
    train_id: str = Field(...)
    journey_date: datetime = Field(...)
    current_station: Optional[LiveStationStop] = None
    next_station: Optional[LiveStationStop] = None
    position: Optional[dict] = None
    delay_minutes: Optional[int] = None
    route: Optional[list[LiveStationStop]] = None
    last_updated: Optional[datetime] = None
    source: Optional[str] = None
