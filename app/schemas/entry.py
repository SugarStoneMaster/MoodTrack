from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from zoneinfo import ZoneInfo

def to_local(dt: datetime, tz: str = "Europe/Rome") -> datetime:
    if not dt:
        return None
    return dt.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo(tz))

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

    @field_validator("created_at", mode="before")
    @classmethod
    def _convert_tz(cls, v):
        return to_local(v, "Europe/Rome")


class PaginatedEntries(BaseModel):
    total: int          # totale entries per quell’utente
    count: int          # numero di elementi in questa pagina
    items: list[EntryOut]