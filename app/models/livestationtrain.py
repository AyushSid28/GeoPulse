from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LiveStationTrain(BaseModel):
    number: str = Field(...)
    name: str = Field(...)
    source: str = Field(...)
    destination: str = Field(...)
    schedule_arrival: str = Field(...)
    schedule_departure: str = Field(...)
    expected_arrival: str = Field(...)
    expected_departure: str = Field(...)
    delay_arrival: str = Field(...)
    delay_departure: str = Field(...)
    halt: str = Field(...)
