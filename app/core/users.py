# app/users.py
import os
from passlib.context import CryptContext
from typing import Dict
from datetime import datetime, timedelta
from jose import jwt
from dotenv import load_dotenv

# carica .env
load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# chiave segreta per firmare i JWT, letta da env
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# “DB” in memoria: username → {hashed_password, scopes}
# In futuro spostare su Azure SQL
fake_users_db: Dict[str, Dict] = {
    "alice": {
        "hashed_password": pwd_context.hash("wonderland"),
        "scopes": ["entries:read", "entries:write"]
    },
    "bob": {
        "hashed_password": pwd_context.hash("builder"),
        "scopes": ["entries:read"]
    }
}

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def authenticate_user(username: str, password: str):
    user = fake_users_db.get(username)
    if not user or not verify_password(password, user["hashed_password"]):
        return None
    return {"username": username, "scopes": user["scopes"]}


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
