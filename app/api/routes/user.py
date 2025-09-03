# app/api/routes/user.py
from fastapi import APIRouter, Depends, HTTPException, status, Security
from sqlalchemy.orm import Session, joinedload
from app.db import SessionLocal
from app.db.models import User, UserSettings
from app.schemas.user import UserWithSettingsOut, UserSettingsUpdate
from app.core.deps import get_current_user  # dipendenza che decodifica il JWT

router = APIRouter(tags=["users"], prefix="/users")

# Dependency per avere una sessione DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/me", response_model=UserWithSettingsOut)
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    user=Security(get_current_user, scopes=["entries:read"]),
    db: Session = Depends(get_db),
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


@router.put("/me")
def update_my_settings(
    body: UserSettingsUpdate,
    me=Security(get_current_user, scopes=["entries:write"]),
    db: Session = Depends(get_db),
):
    us = db.query(UserSettings).filter(UserSettings.user_id == me["username"]).first()
    if not us:
        us = UserSettings(user_id=me["username"])
        db.add(us)
    if body.email_opt_in is not None:
        us.email_opt_in = body.email_opt_in
    if body.weekly_summary_day is not None:
        us.weekly_summary_day = body.weekly_summary_day
    if body.tz_iana:
        us.tz_iana = body.tz_iana
    db.commit()
    return {"ok": True}