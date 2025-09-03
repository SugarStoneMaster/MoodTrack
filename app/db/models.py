import os
from datetime import datetime
from sqlalchemy import (
    create_engine, String, Integer, DateTime, Boolean, func, ForeignKey,
    CheckConstraint, Index
)
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column, relationship
from dotenv import load_dotenv
load_dotenv()

SQL_URL = os.getenv("SQL_URL")
engine = create_engine(SQL_URL, pool_pre_ping=True, pool_recycle=300)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    username: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str | None] = mapped_column(String(256), unique=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    display_name: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(16), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), server_default=func.sysutcdatetime())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False))
    thread_id: Mapped[str | None] = mapped_column(String(64))

    entries: Mapped[list["Entry"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    settings: Mapped["UserSettings | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    devices: Mapped[list["UserDevice"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.username", ondelete="CASCADE"), primary_key=True
    )


    tz_iana: Mapped[str] = mapped_column(String(64), default="Europe/Rome")
    weekly_summary_day: Mapped[int | None] = mapped_column(Integer)  # 0..6
    email_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)
    weekly_last_sent_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=False))

    # reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    # reminder_minute: Mapped[int | None] = mapped_column(Integer)
    # last_sent_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=False))  # debounce
    # push_opt_in: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), server_default=func.sysutcdatetime())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), onupdate=func.sysutcdatetime())

    user: Mapped["User"] = relationship(back_populates="settings")



class Entry(Base):
    __tablename__ = "entries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.username", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(100), index=True)
    content: Mapped[str] = mapped_column(String(2000))
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0–5
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), server_default=func.sysutcdatetime())
    user: Mapped["User"] = relationship(back_populates="entries")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.username", ondelete="CASCADE"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), server_default=func.sysutcdatetime(), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False))
    device: Mapped[str | None] = mapped_column(String(128))
    rotated_from: Mapped[str | None] = mapped_column(String(64))
    user: Mapped["User"] = relationship(back_populates="refresh_tokens")




class UserDevice(Base):
    __tablename__ = "user_devices"
    # InstallationId generato lato app (UUID string) → PK
    installation_id: Mapped[str] = mapped_column(String(64), primary_key=True)

    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.username", ondelete="CASCADE"), index=True, nullable=False
    )

    # 'ios' | 'android'
    platform: Mapped[str] = mapped_column(String(16), nullable=False)

    # Device token APNs/FCM — usa capienza generosa per FCM
    pns_handle: Mapped[str] = mapped_column(String(1024), nullable=False)

    # es: "user:42,platform:ios"
    tags: Mapped[str | None] = mapped_column(String(512))

    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.sysutcdatetime(), nullable=False
    )
    updated_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.sysutcdatetime(), onupdate=func.sysutcdatetime(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="devices")
