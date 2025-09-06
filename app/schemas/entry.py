from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class EntryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1, max_length=2_000)
    mood: int | None = Field(default=None, ge=0, le=5)

class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # ← importante per SQLAlchemy
    id: int
    title: str
    content: str
    mood: int | None
    created_at: datetime


class PaginatedEntries(BaseModel):
    total: int          # totale entries per quell’utente
    count: int          # numero di elementi in questa pagina
    items: list[EntryOut]