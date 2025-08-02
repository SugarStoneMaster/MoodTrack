from fastapi import FastAPI, Depends
from api.auth import require_scope, get_current_user

app = FastAPI()

@app.get("/health")
def health():
    return "OK"

# endpoint di test auth – niente DB
@app.get("/protected", dependencies=[Depends(require_scope("api.read"))])
def protected(user = Depends(get_current_user)):
    return {"msg": "Auth OK", "user": user}