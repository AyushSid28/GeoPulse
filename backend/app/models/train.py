from typing import Optional
from pydantic import BaseModel, Field


class Train(BaseModel):
    id: str = Field(...)
    number: str = Field(...)
    name: str = Field(...)
    type: Optional[str] = None
