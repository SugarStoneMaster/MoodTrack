# app/api/routes/chatbot.py
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.chatbot import ChatbotMessageIn, ChatbotResponse
from app.core.deps import get_current_user, require_scope
from app.db import get_db
from app.db.models import User
from app.api.assistant import (
    assistant_id,
    create_thread,
    add_user_message,
    run_and_wait,
    get_last_assistant_message,
)

router = APIRouter(tags=["chatbot"], prefix="/chatbot")

@router.post(
    "/send_message",
    response_model=ChatbotResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[require_scope("chatbot:write")],
)
def send_message(
    body: ChatbotMessageIn,
    # ⬇️ usa require_scope come dependency PARAMETRICA per ottenere il user
    user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not assistant_id:
        raise HTTPException(status_code=500, detail="Assistant non configurato (ASSISTANT_ID mancante)")
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Messaggio vuoto")

    thread_id = (body.thread_id or "").strip()
    if not thread_id:
        db_user = db.query(User).filter(User.username == user["username"]).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Utente non trovato")

        if db_user.thread_id:
            thread_id = db_user.thread_id
        else:
            thread_id = create_thread()
            db_user.thread_id = thread_id
            db.commit()

    # 2) aggiungi messaggio utente
    try:
        add_user_message(thread_id, body.message)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Errore nel passare il messaggio al thread: {e}")

    # 3) run + polling
    try:
        status_str = run_and_wait(thread_id, assistant_id, timeout_s=60)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Errore durante l'esecuzione del run: {e}")

    if status_str != "completed":
        raise HTTPException(status_code=502, detail=f"Run non completato (stato: {status_str})")

    # 4) recupera risposta
    try:
        reply = get_last_assistant_message(thread_id) or ""
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Errore nel recupero della risposta: {e}")

    if not reply:
        reply = "(nessuna risposta generata)"

    return ChatbotResponse(thread_id=thread_id, reply=reply)