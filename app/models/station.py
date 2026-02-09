from typing import Optional
from pydantic import BaseModel, Field


class Station(BaseModel):
    id: str = Field(...)
    code: str = Field(...)
    name: str = Field(...)
    lat: Optional[float] = None
    lng: Optional[float] = None
    zone: Optional[str] = None
