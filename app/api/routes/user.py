# app/api/routes/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.db import SessionLocal
from app.db.models import User
from app.schemas.user import UserWithSettingsOut
from app.core.deps import get_current_user  # dipendenza che decodifica il JWT

router = APIRouter(tags=["users"])

# Dependency per avere una sessione DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/users/me", response_model=UserWithSettingsOut)
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .options(joinedload(User.settings))
        .filter(User.username == current_user["username"])
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user