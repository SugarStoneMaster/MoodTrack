# app/api/internal.py
import hashlib
import logging
import os, hmac
from typing import Annotated
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.db.models import Entry

router = APIRouter(prefix="/internal", tags=["internal"])


JOB_KEY = os.getenv("JOB_KEY","")

def check_job_key(x_job_key: str | None = Header(None, alias="X-Job-Key")):
    if not JOB_KEY:
        raise HTTPException(status_code=500, detail="job key not configured")

    # log diagnostico non sensibile
    logging.info("internal.check_job_key | header_present=%s len=%s",
                 x_job_key is not None, len(x_job_key or ""))

    ok = x_job_key is not None and hmac.compare_digest(
        hashlib.sha256((x_job_key or "").encode()).digest(),
        hashlib.sha256(JOB_KEY.encode()).digest()
    )
    if not ok:
        raise HTTPException(status_code=401, detail="invalid job key")

@router.get("/entries/{entry_id}")
def get_entry(
    entry_id: int,
    _: None = Depends(check_job_key),
    db: Session = Depends(get_db),
):
    e = db.query(Entry).filter(Entry.id == entry_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="not found")
    return {"id": e.id, "content": e.content}

@router.patch("/entries/{entry_id}/sentiment")
def patch_sentiment(
    entry_id: int,
    body: dict,
    _: None = Depends(check_job_key),
    db: Session = Depends(get_db),
):
    score = body.get("sentiment_score")
    if score is None:
        raise HTTPException(status_code=400, detail="missing score")
    updated = db.query(Entry).filter(Entry.id == entry_id).update({"mood": score})
    if updated == 0:
        raise HTTPException(status_code=404, detail="not found")
    db.commit()
    return {"ok": True}