# api/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from .users import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from .auth import require_scope

app = FastAPI()

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Username o password errati")
    access_token = create_access_token(
        data={"sub": user["username"], "scopes": user["scopes"]},
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/health")
def health():
    return "OK"

@app.post(
    "/entries",
    dependencies=[Depends(require_scope("entries:write"))],
)
def create_entry():
    # tua logica di creazione
    return {"msg": "entry creata"}

@app.get(
    "/entries",
    dependencies=[Depends(require_scope("entries:read"))],
)
def list_entries():
    # tua logica di lettura
    return {"msg": "entries lette"}