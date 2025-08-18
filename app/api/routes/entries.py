from fastapi import APIRouter, Depends, status, Security
from sqlalchemy.orm import Session
from app.api.queueing import enqueue_entry
from app.core.deps import get_current_user, require_scope
from app.db import get_db
from app.db.models import Entry
from app.schemas.entry import EntryCreate, EntryOut

router = APIRouter()



@router.post("/entries", response_model=EntryOut, status_code=status.HTTP_201_CREATED,)
def create_entry(
        body: EntryCreate,
        user=Security(get_current_user, scopes=["entries:write"]),
        db: Session = Depends(get_db),
):
    e = Entry(
        user_id=user["username"],
        title=body.title,
        content=body.content,
        mood=body.mood,
    )
    db.add(e); db.commit(); db.refresh(e)
    #enqueue_entry(e.id)
    return e

@router.get(
    "/entries",
    response_model=list[EntryOut],
)
def list_entries(
    user = Security(get_current_user, scopes=["entries:read"]),
    db: Session = Depends(get_db),
):
    return (
        db.query(Entry)
        .filter(Entry.user_id == user["username"])
        .order_by(Entry.id.desc())
        .limit(50)
        .all()
    )