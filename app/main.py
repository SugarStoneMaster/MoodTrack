
import app.obs.otel_init
from fastapi import FastAPI
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from app.api.routes import health
from app.api.routes import internal, chatbot
from app.db import Base, engine
from app.api.routes import auth, entries, user
from app.core.feature_flags import snapshot
import logging
from app.obs.enrich import TelemetryEnricher

logging.getLogger("azure").setLevel(logging.WARNING)
logging.getLogger("azure.core.pipeline.policies.http_logging_policy").setLevel(logging.WARNING)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s | %(message)s"
)
app = FastAPI(title="MoodTrack API")
FastAPIInstrumentor.instrument_app(app)

@app.on_event("startup")
def log_flags_on_startup():
    snap = snapshot()
    for k, v in snap["flags"].items():
        logging.info("Feature flag: %s = %s", k, v)

# crea le tabelle (solo dev)
# Base.metadata.create_all(bind=engine)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(entries.router)
app.include_router(user.router)
app.include_router(internal.router)
app.include_router(chatbot.router)

app.add_middleware(TelemetryEnricher)

