from typing import Optional, Union
from pydantic import BaseModel, Field


class LiveStationStop(BaseModel):
    station_code: str = Field(...)
    station_name: str = Field(...)
    sequence: int = Field(...)
    scheduled_arrival: Optional[str] = None
    actual_arrival: Optional[str] = None
    delay_arrival: Optional[str] = None
    scheduled_departure: Optional[str] = None
    actual_departure: Optional[str] = None
    delay_departure: Optional[str] = None
    is_departed: Optional[Union[bool, str]] = None
