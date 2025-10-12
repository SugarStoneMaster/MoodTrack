# app/users.py
import hashlib
import os
import secrets
import uuid
import logging
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.db.models import User, RefreshToken

load_dotenv()

# Logging
logger = logging.getLogger("uvicorn.error")

# Use bcrypt for existing hashes, consider adding argon2 later
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))


def authenticate_user(db: Session, username: str, password: str):
    """
    Restituisce {username, scopes} se credenziali ok, altrimenti None.
    Esegue rehash automatico se necessario.
    """
    user = db.get(User, username)
    if not user:
        return None
    if not verify_password(password, user.password_hash, db=db, user_obj=user):
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


def verify_password(plain: str, hashed: str, db: Session | None = None, user_obj: User | None = None) -> bool:
    """
    Verify password with passlib/pwd_context.
    - Se passlib lancia ValueError (bcrypt eccesso di lunghezza), prova il truncation intelligente a 72 bytes.
    - Se il verify ha successo e pwd_context.needs_update(hashed) è True, esegue rehash e aggiorna il DB (se fornito).
    - Non loggare mai la password in chiaro; solo informazioni diagnostiche (lunghezza).
    """
    if plain is None or hashed is None:
        return False

    # byte-length effettiva (bcrypt conta bytes)
    plain_bytes = plain.encode("utf-8", errors="ignore")
    tried_plain_for_verify = plain  # value we will pass to pwd_context.verify

    try:
        # primo tentativo diretto
        ok = False
        try:
            ok = pwd_context.verify(tried_plain_for_verify, hashed)
        except ValueError as ve:
            # probabilmente password >72 bytes (bcrypt)
            logger.warning("pwd_context.verify raised ValueError: %s; trying bcrypt-style truncation (len=%d)", ve, len(plain_bytes))
            if len(plain_bytes) > 72:
                # tronca ai primi 72 bytes (bcrypt behaviour)
                tried_plain_for_verify = plain_bytes[:72].decode("utf-8", errors="ignore")
                ok = pwd_context.verify(tried_plain_for_verify, hashed)
            else:
                # non ci sono bytes in eccesso: rilancia per essere sicuri
                raise

        if ok:
            # rehash on login se policy lo richiede (e se abbiamo accesso al DB / user_obj)
            try:
                if db is not None and user_obj is not None and pwd_context.needs_update(hashed):
                    logger.info("Rehashing password for user=%s (pwd_context needs update)", user_obj.username)
                    new_hash = pwd_context.hash(tried_plain_for_verify)
                    user_obj.password_hash = new_hash
                    db.add(user_obj)
                    db.commit()
            except Exception as re:
                # non bloccare l'autenticazione per problemi di update hash; loggare l'errore
                logger.exception("Failed to rehash & update password for user %s: %s", getattr(user_obj, "username", "<unknown>"), re)

        return bool(ok)

    except Exception as e:
        # logga diagnostica ma non la password; restituisci False
        logger.exception("Error verifying password (username=%s, pass_bytes_len=%d): %s", getattr(user_obj, "username", "<unknown>"), len(plain_bytes), e)
        return False


# opzionale: helper per hashing quando creerai utenti via API/CLI
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)