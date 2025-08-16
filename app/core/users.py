# app/users.py
import hashlib
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.db.models import User, RefreshToken

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))



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
    scopes = ["entries:read", "entries:write", "chatbot:read", "chatbot:write"]
    return {"username": user.username, "scopes": scopes}


def _now():
    return datetime.now(timezone.utc)

def _sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = _now() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(db: Session, user_id: str, device: str | None = None) -> str:
    # token opaco random + hash su DB (mai salvare in chiaro)
    raw = secrets.token_urlsafe(48)
    tok = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash=_sha256(raw),
        created_at=_now(),
        expires_at=_now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        device=device,
    )
    db.add(tok)
    db.commit()
    return raw  # restituisci SOLO al client; su DB c'è l'hash

def rotate_refresh_token(db: Session, raw_old: str, device: str | None = None) -> tuple[str, RefreshToken]:
    h = _sha256(raw_old)
    old = db.query(RefreshToken).filter(
        RefreshToken.token_hash == h,
        RefreshToken.revoked_at.is_(None),
        RefreshToken.expires_at > _now(),
    ).first()
    if not old:
        raise ValueError("invalid refresh token")

    # single-use: revoca l’attuale e creane uno nuovo legato allo stesso utente
    old.revoked_at = _now()
    new_raw = secrets.token_urlsafe(48)
    new_tok = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=old.user_id,
        token_hash=_sha256(new_raw),
        created_at=_now(),
        expires_at=_now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        device=device,
        rotated_from=old.id,
    )
    db.add(new_tok)
    db.commit()
    return new_raw, new_tok

def revoke_all_user_tokens(db: Session, user_id: str):
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None)
    ).update({RefreshToken.revoked_at: _now()})
    db.commit()



def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# opzionale: helper per hashing quando creerai utenti via API/CLI
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)