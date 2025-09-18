from fastapi import APIRouter, Depends, status, Security, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.queueing import enqueue_entry
from app.core.deps import get_current_user, require_scope
from app.db import get_db
from app.db.models import Entry
from app.schemas.entry import EntryCreate, EntryOut, PaginatedEntries

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
    enqueue_entry(e.id)
    return e


@router.get("/entries", response_model=PaginatedEntries)
def list_entries(
    user = Security(get_current_user, scopes=["entries:read"]),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    q = db.query(Entry).filter(Entry.user_id == user["username"])
    total = q.count()
    items = (
        q.order_by(Entry.id.desc())
         .offset(skip)
         .limit(limit)
         .all()
    )
    return {
        "total": total,
        "count": len(items),   # numero entries ritornate in questa pagina
        "items": items,
    }


@router.get("/entries/{entry_id}", response_model=EntryOut)
def get_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    user=Security(get_current_user, scopes=["entries:read"])
):
    e = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == user["username"]  # o user["id"], dipende dal tuo token
    ).first()

    if not e:
        raise HTTPException(status_code=404, detail="not found")
    return e