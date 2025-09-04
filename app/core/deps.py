import os

from fastapi import Depends, HTTPException, status, Security, Request
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from typing import List
from jose import jwt
from opentelemetry import trace

from app.core.users import SECRET_KEY, ALGORITHM


oauth2 = OAuth2PasswordBearer(
    tokenUrl="auth/login",
    scopes={
        "entries:read": "Leggi le voci del diario",
        "entries:write": "Crea nuove voci",
        "chatbot:write": "Invia messaggi al chatbot",
        "chatbot:read": "Legge messaggi dal chatbot",
    }
)

async def get_current_user(request: Request, security_scopes: SecurityScopes, token: str = Security(oauth2)):
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide",
        headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub") or payload.get("username") or payload.get("uid")
        token_scopes: List[str] = payload.get("scopes", [])
        if not username:
            raise cred_exc
    except Exception:
        raise cred_exc

    request.state.user_id = str(username)

    span = trace.get_current_span()
    if span:
        span.set_attribute("user.id", str(username))

    for s in security_scopes.scopes:
        if s not in token_scopes:
            raise HTTPException(status_code=403, detail="Scope insufficiente")
    return {"username": username, "scopes": token_scopes}


def require_scope(scope: str):
    return Depends(lambda user=Depends(get_current_user): user)  # semplice wrapper


async def stamp_user(request: Request, me = Depends(get_current_user)):
    """
    Dipendenza che salva lo user_id nel request.state per la telemetria.
    """
    # Adatta il campo: "username", "sub", "id"… dipende dal tuo get_current_user
    uid = me.get("username") or me.get("sub") or me.get("id")
    if uid:
        request.state.user_id = str(uid)
    return me  # così le route che la usano hanno anche 'me'