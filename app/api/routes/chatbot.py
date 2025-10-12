# app/api/routes/chatbot.py
import asyncio
import json
import threading

from fastapi import APIRouter, Depends, HTTPException, status, Query, Security
from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

from app.schemas.chatbot import ChatbotMessageIn, ChatbotResponse
from app.core.deps import get_current_user
from app.db import get_db
from app.db.models import User
from app.api.services.assistant import (
    assistant_id,
    create_thread,
    add_user_message,
    get_last_assistant_message,
    run,
)
from app.core.feature_flags import get_bool, get_value

router = APIRouter(tags=["chatbot"], prefix="/chatbot")

@router.post(
    "/send_message",
    response_model=ChatbotResponse,
    status_code=status.HTTP_200_OK,
)
def send_message(
    body: ChatbotMessageIn,
    user = Security(get_current_user, scopes=["chatbot:write"]),
    db: Session = Depends(get_db),
    streaming: bool = Query(False, description="Se true, risposta in streaming via SSE"),
    debug: bool = Query(True, description="Se true, risposta in debug via SSE"),
):
    if not get_bool("features:chatbot_enabled", default=True):
        raise HTTPException(status_code=503, detail="Chatbot temporarily disabled")
    if not assistant_id:
        raise HTTPException(500, "Assistant non configurato (ASSISTANT_ID mancante)")
    if not body.message.strip():
        raise HTTPException(400, "Messaggio vuoto")

    # 1) thread: usa quello del body oppure carica/crea e persisti su DB
    thread_id = (body.thread_id or "").strip()
    if not thread_id:
        db_user = db.query(User).filter(User.username == user["username"]).first()
        if not db_user:
            raise HTTPException(404, "Utente non trovato")

        if db_user.thread_id:
            thread_id = db_user.thread_id
        else:
            thread_id = create_thread()
            db_user.thread_id = thread_id
            db.commit()

    # 2) append messaggio utente
    try:
        add_user_message(thread_id, body.message)
    except Exception as e:
        raise HTTPException(502, f"Errore nel passare il messaggio al thread: {e}")

    # 3) esecuzione assistant
    if streaming:
        async def sse_gen():
            yield f"event: meta\ndata: {json.dumps({'thread_id': thread_id})}\n\n"

            q: asyncio.Queue[str | None] = asyncio.Queue(maxsize=512)
            loop = asyncio.get_running_loop()

            def produce():
                try:
                    asyncio.run_coroutine_threadsafe(
                        q.put("__DBG__:producer-started"), loop
                    ).result()
                    for piece in run(thread_id, streaming=True):
                        asyncio.run_coroutine_threadsafe(q.put(piece), loop).result()
                except Exception as e:
                    pass
                    #asyncio.run_coroutine_threadsafe(q.put(f\"__ERR__:{e}\"), loop).result()
                finally:
                    asyncio.run_coroutine_threadsafe(q.put(None), loop).result()

            threading.Thread(target=produce, daemon=True).start()

            while True:
                try:
                    chunk = await asyncio.wait_for(q.get(), timeout=2.0)
                except asyncio.TimeoutError:
                    yield "event: ping\ndata: {}\n\n"
                    continue

                if chunk is None:
                    break
                if chunk.startswith("__ERR__:"):
                    detail = chunk.replace("__ERR__:", "", 1)
                    yield f"event: error\ndata: {json.dumps({'detail': detail})}\n\n"
                    break
                if chunk.startswith("__DBG__:"):
                    yield f"event: debug\ndata: {json.dumps({'note': chunk[8:]})}\n\n"
                    continue
                if chunk.startswith("__EVT__:"):
                    # inoltra il tipo di evento SDK per capire cosa arriva nel container
                    yield f"event: sdk\ndata: {json.dumps({'type': chunk[8:]})}\n\n"
                    continue

                # vero testo
                yield f"event: delta\ndata: {json.dumps({'text': chunk})}\n\n"

            yield "event: done\ndata: {}\n\n"

        return StreamingResponse(
            sse_gen(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    # → percorso non-streaming (polling + risposta finale)
    try:
        status_str = run(thread_id, streaming=False, timeout_s=60)
    except Exception as e:
        raise HTTPException(502, f"Errore durante l'esecuzione del run: {e}")

    if status_str != "completed":
        raise HTTPException(502, f"Run non completato (stato: {status_str})")

    # 4) recupera risposta intera
    try:
        reply = get_last_assistant_message(thread_id) or ""
    except Exception as e:
        raise HTTPException(502, f"Errore nel recupero della risposta: {e}")

    if not reply:
        reply = "(nessuna risposta generata)"

    return ChatbotResponse(thread_id=thread_id, reply=reply)


@router.get("/prompt_of_day")
def get_prompt():
    if not get_bool("features:prompts_daily_enabled", True):
        return {"enabled": False}
    text = get_value("ui:prompt_of_day_text", "Di cosa sei grato oggi?")
    return {"enabled": True, "text": text}



@router.get("/thread_id", response_model=dict)
def get_thread_id(
    me=Security(get_current_user, scopes=["entries:read"]),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == me["username"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"thread_id": user.thread_id}