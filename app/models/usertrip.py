from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserTrip(BaseModel):
    id: str = Field(...)
    user_id: Optional[str] = None
    train_id: str = Field(...)
    started_at: datetime = Field(...)
    ended_at: Optional[datetime] = None
