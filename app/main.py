from fastapi import FastAPI

from app.api.routes import internal, chatbot
from app.db import Base, engine
from app.api.routes import auth, entries, user

app = FastAPI(title="MoodTrack API")

# crea le tabelle (solo dev)
# Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(entries.router)
app.include_router(user.router)
app.include_router(internal.router)
app.include_router(chatbot.router)