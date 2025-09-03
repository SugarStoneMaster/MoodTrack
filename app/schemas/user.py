from typing import Optional

from pydantic import BaseModel, Field, ConfigDict, SecretStr
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: SecretStr

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    created_at: datetime

class UserSettingsOut(BaseModel):
    tz_iana: str
    weekly_summary_day: Optional[int]  # 0–6
    email_opt_in: bool
    weekly_last_sent_at_utc: datetime

    # reminder_enabled: bool
    # reminder_minute: Optional[int]     # 0..1439, può essere None
    # last_sent_at_utc: Optional[datetime]
    # push_opt_in: bool

    created_at: datetime
    updated_at: Optional[datetime]


class UserSettingsUpdate(BaseModel):
    tz_iana: str
    weekly_summary_day: Optional[int]  # 0–6
    email_opt_in: bool
    weekly_last_sent_at_utc: datetime

    # reminder_minute: int | None = Field(default=None, ge=0, le=23)
    # tz_iana: str | None = None
    # reminder_enabled: bool | None = None


class UserWithSettingsOut(BaseModel):
    username: str
    email: Optional[str]
    display_name: Optional[str]
    status: str
    created_at: datetime
    last_login_at: Optional[datetime]
    settings: Optional[UserSettingsOut]

    class Config:
        orm_mode = True