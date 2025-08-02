# api/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import JWTError, jwt
from typing import List
from .users import SECRET_KEY, ALGORITHM

oauth2 = OAuth2PasswordBearer(
    tokenUrl="token",
    scopes={
        "entries:read": "Leggi le voci del diario",
        "entries:write": "Crea nuove voci"
    }
)

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token non valido o scaduto",
        headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_scopes: List[str] = payload.get("scopes", [])
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    for scope in security_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Scope insufficiente",
                headers={"WWW-Authenticate": f'Bearer scope="{security_scopes.scope_str}"'}
            )
    return {"username": username, "scopes": token_scopes}


def require_scope(scope: str):
    def dep(user = Depends(get_current_user)):
        # raise if missing
        if scope not in user["scopes"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="insufficient_scope")
        return user
    return dep


