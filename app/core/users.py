# app/users.py
import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.db.models import User

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def authenticate_user(db: Session, username: str, password: str):
    """
    Restituisce {username, scopes} se credenziali ok, altrimenti None.
    Gli scope base li decidiamo qui (o in tabella se preferisci in futuro).
    """
    user = db.get(User, username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    # scopes minimi: lettura/scrittura proprie entries
    scopes = ["entries:read", "entries:write"]
    return {"username": user.username, "scopes": scopes}

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# opzionale: helper per hashing quando creerai utenti via API/CLI
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)