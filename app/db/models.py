import os
from sqlalchemy import create_engine, String, Integer, DateTime, func
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column
from dotenv import load_dotenv          # ⬅️  nuovo
load_dotenv()

SQL_URL = os.getenv("SQL_URL")
engine = create_engine(SQL_URL, pool_pre_ping=True, pool_recycle=300)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class Entry(Base):
    __tablename__ = "entries"
    id: Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    content: Mapped[str] = mapped_column(String(2000))
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=False), server_default=func.sysutcdatetime()
    )