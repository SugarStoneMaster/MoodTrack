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


def run_and_wait(thread_id: str, assistant_id: str, timeout_s=60):
    run = client.beta.threads.runs.create(
        thread_id=thread_id, assistant_id=assistant_id
    )

    # polling semplice; in alternativa stream eventi
    # Looping until the run completes or fails
    while run.status in ['queued', 'in_progress', 'cancelling']:
        time.sleep(1)
        run = client.beta.threads.runs.retrieve(
            thread_id=thread_id,
            run_id=run.id
        )

    return run.status


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