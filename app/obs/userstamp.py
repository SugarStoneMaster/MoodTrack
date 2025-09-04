# app/obs/userstamp.py
from fastapi import Request, Security
from opentelemetry import trace
from app.core.deps import get_current_user  # la tua dipendenza che valida il JWT

def stamp_user_id(request: Request, me = Security(get_current_user, scopes=[])):
    # 1) metti l'ID sulla request per eventuali usi downstream
    request.state.user_id = me["username"]

    # 2) metti l'ID direttamente sullo span corrente (più affidabile del middleware)
    span = trace.get_current_span()
    if span is not None:
        span.set_attribute("user.id", str(me["username"]))

    return me  # opzionale, se vuoi iniettarlo anche nelle route