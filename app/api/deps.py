from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from typing import List
from jose import jwt
from app.core.users import SECRET_KEY, ALGORITHM

oauth2 = OAuth2PasswordBearer(
    tokenUrl="token",
    scopes={
        "entries:read": "Leggi le voci del diario",
        "entries:write": "Crea nuove voci"
    }
)

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2),
):
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide",
        headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_scopes: List[str] = payload.get("scopes", [])
        if username is None:
            raise cred_exc
    except Exception:
        raise cred_exc

    for scope in security_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Scope insufficiente",
                headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'},
            )
    return {"username": username, "scopes": token_scopes}

def require_scope(scope: str):
    return Depends(lambda user=Depends(get_current_user): user)  # semplice wrapper