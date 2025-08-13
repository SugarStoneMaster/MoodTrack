from pydantic import BaseModel, Field

class ChatbotMessageIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    thread_id: str | None = None

class ChatbotResponse(BaseModel):
    thread_id: str
    reply: str