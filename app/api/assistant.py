import os, time
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview"),
)
assistant_id = os.getenv("AZURE_OPENAI_ASSISTANT_ID")



def create_thread():
    return client.beta.threads.create().id

def add_user_message(thread_id: str, text: str):
    return client.beta.threads.messages.create(
        thread_id=thread_id, role="user", content=text
    )


def run(thread_id: str, streaming: bool = False, timeout_s: int = 60):
    if not streaming:
        run_obj = client.beta.threads.runs.create(
            thread_id=thread_id, assistant_id=assistant_id
        )
        while run_obj.status in ("queued", "in_progress", "cancelling"):
            time.sleep(1)
            run_obj = client.beta.threads.runs.retrieve(
                thread_id=thread_id, run_id=run_obj.id
            )
        return run_obj.status

    # -------- generator bloccante che produce pezzi di testo --------
    def _gen():
        with client.beta.threads.runs.stream(
            thread_id=thread_id,
            assistant_id=assistant_id,
        ) as stream:
            yielded_any = False

            # 1) via iteratore text_deltas (se disponibile)
            try:
                for td in getattr(stream, "text_deltas", []):
                    piece = getattr(td, "delta", None) or getattr(td, "text", None) or getattr(td, "value", None)
                    if piece:
                        yielded_any = True
                        yield str(piece)
            except Exception:
                pass

            # 2) fallback: parsing per-evento (copre più shape)
            if not yielded_any:
                for event in stream:
                    etype = getattr(event, "type", "") or ""
                    # (opz) debug: lasciare questa riga per capire cosa arriva
                    # yield f"__EVT__:{etype}"

                    # A) thread.message.delta / message.delta
                    if etype.endswith("thread.message.delta") or etype.endswith("message.delta"):
                        delta = getattr(event, "delta", None)
                        if delta:
                            for block in (getattr(delta, "content", None) or []):
                                if getattr(block, "type", None) == "text":
                                    t = getattr(block, "text", None)
                                    if t and getattr(t, "value", None):
                                        yielded_any = True
                                        yield t.value
                                elif getattr(block, "value", None):
                                    yielded_any = True
                                    yield str(block.value)

                    # B) response.output_text.delta / text.delta / response.delta
                    if ("output_text.delta" in etype) or ("text.delta" in etype) or ("response.delta" in etype):
                        d = getattr(event, "delta", None)
                        if d:
                            txt = getattr(d, "text", None)
                            if txt and getattr(txt, "value", None):
                                yielded_any = True
                                yield txt.value
                            elif getattr(d, "value", None):
                                yielded_any = True
                                yield str(d.value)
                        elif getattr(event, "text", None) and getattr(event.text, "value", None):
                            yielded_any = True
                            yield event.text.value

                    # C) errori / fine
                    if ("run.failed" in etype) or ("response.error" in etype):
                        raise RuntimeError(f"run stream error: {etype}")
                    if ("run.completed" in etype) or ("response.completed" in etype):
                        break

            # 3) Fallback finale: nessun delta? prendi la risposta finale e “spacchettala”
            try:
                final = stream.get_final_response()
            except Exception:
                final = None

            if not yielded_any and final is not None:
                # prova a estrarre testo finale in vari modi
                text = getattr(final, "output_text", None)
                if not text:
                    # shape alternativa: primo messaggio completato
                    try:
                        msg = final.data[0].content[0].text.value
                        text = msg
                    except Exception:
                        text = None
                if text:
                    # invia almeno 1-2 "delta" per UX coerente
                    chunk_size = 120
                    for i in range(0, len(text), chunk_size):
                        yield text[i:i+chunk_size]

    return _gen()



def get_last_assistant_message(thread_id: str) -> str:
    msgs = client.beta.threads.messages.list(thread_id=thread_id)
    for m in msgs.data:
        if m.role == "assistant":
            parts = [c.text.value for c in m.content if getattr(c, "type", None)=="text"]
            if parts: return "".join(parts)
    return ""









"""
def create_assistant():
    # 1) crea (una volta) l'assistente
    a = client.beta.assistants.create(
        name="MoodTrack Confidente",
        instructions=(
            "Sei MoodTrack, un confidente empatico. Non sei un terapeuta. "
            "Rispondi in modo breve, non giudicante, con 1 domanda di follow-up."
        ),
        model=MODEL,
        tools=[]  # in futuro: [{"type":"function", "function": {...}}], "file_search", "code_interpreter"
    )
    return a
"""