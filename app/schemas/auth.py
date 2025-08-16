from pydantic import BaseModel

from app.core.users import ACCESS_TOKEN_EXPIRE_MINUTES


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginIn(BaseModel):
    username: str
    password: str
    device: str | None = None  # opzionale (installationId, ecc.)

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60

class RefreshIn(BaseModel):
    refresh_token: str
    device: str | None = None