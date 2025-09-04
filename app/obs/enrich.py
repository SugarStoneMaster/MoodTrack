# app/obs/enrich.py
from starlette.middleware.base import BaseHTTPMiddleware
from opentelemetry import trace
import os
from fastapi import Request, Security
from app.core.deps import get_current_user

class TelemetryEnricher(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Prendi l’utente dal tuo layer auth (es. request.state.user_id impostato dal JWT)
        uid = getattr(request.state, "user_id", None)
        span = trace.get_current_span()
        if span is not None:
            if uid:
                span.set_attribute("user.id", str(uid))
            span.set_attribute("env", os.getenv("APP_ENV", "dev"))
        return await call_next(request)




# Dipendenza che, se il token è valido, valorizza request.state.user_id
def stamp_user_id(request: Request, me = Security(get_current_user, scopes=[])):
    # me è il dict che già usi nelle route: {"username": "...", "scopes": [...]}
    request.state.user_id = me["username"]
    return me  # opzionale: così puoi anche iniettarlo nelle route se serve