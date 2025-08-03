from fastapi import FastAPI
from app.db import Base, engine
from app.api.routes import auth, entries

app = FastAPI(title="MoodTrack API")

# crea le tabelle (solo dev)
# Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(entries.router)