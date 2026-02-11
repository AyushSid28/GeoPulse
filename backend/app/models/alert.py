from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Alert(BaseModel):
    id: str = Field(...)
    user_id: Optional[str] = None
    train_id: str = Field(...)
    station_id: str = Field(...)
    minutes_before: int = Field(...)
    triggered_at: Optional[datetime] = None
