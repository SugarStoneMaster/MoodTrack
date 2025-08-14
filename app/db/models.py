import os
from sqlalchemy import create_engine, String, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column, relationship
from dotenv import load_dotenv          # ⬅️  nuovo
load_dotenv()

SQL_URL = os.getenv("SQL_URL")
engine = create_engine(SQL_URL, pool_pre_ping=True, pool_recycle=300)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    username: Mapped[str] = mapped_column(String(64), primary_key=True)  # PK semplice
    email: Mapped[str | None] = mapped_column(String(256), unique=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    display_name: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(16), default="active")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=False), server_default=func.sysutcdatetime())
    last_login_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=False))
    thread_id: Mapped[str | None] = mapped_column(String(64))

    entries: Mapped[list["Entry"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    settings: Mapped["UserSettings | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserSettings(Base):
    __tablename__ = "user_settings"
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.username", ondelete="CASCADE"), primary_key=True
    )
    timezone: Mapped[str] = mapped_column(String(64), default="Europe/Rome")
    reminder_enabled: Mapped[bool] = mapped_column(default=True)
    reminder_hour_local: Mapped[int | None] = mapped_column(Integer)     # 0–23 se vuoi aggiungi CHECK a DB
    weekly_summary_day: Mapped[int | None] = mapped_column(Integer)      # 0–6
    push_opt_in: Mapped[bool] = mapped_column(default=True)
    email_opt_in: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=False), server_default=func.sysutcdatetime())
    updated_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=False))

    user: Mapped["User"] = relationship(back_populates="settings")

class Entry(Base):
    __tablename__ = "entries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.username", ondelete="CASCADE"), index=True
    )
    content: Mapped[str] = mapped_column(String(2000))
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)     # 0–10 se vuoi aggiungi CHECK a DB
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=False), server_default=func.sysutcdatetime()
    )

    user: Mapped["User"] = relationship(back_populates="entries")