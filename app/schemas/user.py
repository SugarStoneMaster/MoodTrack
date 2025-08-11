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
    model_config = ConfigDict(from_attributes=True)
    reminder_hour: int | None = Field(default=None, ge=0, le=23)
    tz: str | None = None
    notifications_enabled: bool = True

class UserSettingsUpdate(BaseModel):
    reminder_hour: int | None = Field(default=None, ge=0, le=23)
    tz: str | None = None
    notifications_enabled: bool | None = None