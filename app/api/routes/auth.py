# app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.util import deprecated

from app.db import get_db
from app.core.users import authenticate_user, create_access_token, create_refresh_token, \
    rotate_refresh_token  # usa la versione DB
from app.schemas import TokenResponse
from app.schemas.auth import TokenPair, LoginIn, RefreshIn

router = APIRouter(tags=["auth"], prefix="/auth")


@router.post("/login", response_model=TokenPair)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenziali non valide")

    access = create_access_token({"sub": user["username"], "scopes": user["scopes"]})
    refresh = create_refresh_token(db, user_id=user["username"], device=body.device)
    return TokenPair(access_token=access, refresh_token=refresh)

@router.post("/refresh", response_model=TokenPair)
def refresh(body: RefreshIn, db: Session = Depends(get_db)):
    try:
        new_refresh_raw, token_row = rotate_refresh_token(db, body.refresh_token, device=body.device)
    except ValueError:
        raise HTTPException(status_code=401, detail="Refresh token non valido")

    # scopes: puoi caricarli dall’utente se vuoi
    access = create_access_token({"sub": token_row.user_id, "scopes": ["entries:read","entries:write","chatbot:write", "chatbot:read"]})
    return TokenPair(access_token=access, refresh_token=new_refresh_raw)

"""
@router.post("/logout")
def logout_all_devices(user=Depends(...)):  # opzionale: usa il tuo get_current_user
    # revoke_all_user_tokens(db, user_id=user["username"])
    return {"ok": True}
"""






@deprecated
@router.post("/token", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(form_data: OAuth2PasswordRequestForm = Depends(),
         db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username o password errati",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user["username"], "scopes": user["scopes"]})
    return {"access_token": token, "token_type": "bearer"}