# app/obs/enrich.py
from starlette.middleware.base import BaseHTTPMiddleware
from opentelemetry import trace
import os

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