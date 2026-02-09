from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RouteGeometry(BaseModel):
    id: str = Field(...)
    train_id: str = Field(...)
    geometry: list[list[float]] = Field(
        ..., description="List of [lng, lat] coordinates"
    )
    updated_at: Optional[datetime] = None
