import os, httpx, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWKClient
from dotenv import load_dotenv

load_dotenv()

OIDC_URL   = os.getenv("B2C_OPENID_CONFIG_URL")
AUDIENCE   = os.getenv("B2C_AUDIENCE")
ISSUER     = os.getenv("B2C_ISSUER")

_security  = HTTPBearer()
_jwks      = None
_iss_cache = None

async def _init():
    global _jwks, _iss_cache
    async with httpx.AsyncClient() as c:
        meta = (await c.get(OIDC_URL, timeout=10)).json()
    _jwks      = PyJWKClient(meta["jwks_uri"])
    _iss_cache = ISSUER or meta["issuer"]

async def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(_security)
):
    if _jwks is None:
        await _init()

    try:
        token = cred.credentials
        key   = _jwks.get_signing_key_from_jwt(token).key
        payload = jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            audience=AUDIENCE,
            issuer=_iss_cache,
            options={"verify_exp": True},
        )
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(ex))

    scopes = set((payload.get("scp") or "").split())
    return {"sub": payload.get("sub"), "scopes": scopes}

def require_scope(scope: str):
    def _dep(user = Depends(get_current_user)):
        if scope not in user["scopes"]:
            raise HTTPException(status_code=403, detail="insufficient_scope")
        return user
    return _dep