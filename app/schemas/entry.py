from pydantic import BaseModel, Field
from datetime import datetime

class EntryCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2_000)
    mood: int | None = Field(default=None, ge=0, le=10)

class EntryOut(BaseModel):
    id: int
    content: str
    mood: int | None
    created_at: datetime