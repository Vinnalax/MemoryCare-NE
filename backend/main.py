from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import DateTime, Float, Integer, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "memorycare.db"

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class GameResult(Base):
    __tablename__ = "game_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_type: Mapped[str] = mapped_column(String(80), index=True)
    score: Mapped[float] = mapped_column(Float)
    accuracy: Mapped[float] = mapped_column(Float)
    mistakes: Mapped[int] = mapped_column(Integer, default=0)
    response_time_seconds: Mapped[float] = mapped_column(Float, default=0)
    difficulty: Mapped[str] = mapped_column(String(20), default="easy")
    completed: Mapped[int] = mapped_column(Integer, default=1)
    played_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(120))
    details: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    time: Mapped[str] = mapped_column(String(20))
    kind: Mapped[str] = mapped_column(String(50), default="Daily")
    done: Mapped[int] = mapped_column(Integer, default=0)


Base.metadata.create_all(engine)

app = FastAPI(title="MemoryCare NE API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


class GameResultIn(BaseModel):
    game_type: str
    score: float = Field(ge=0)
    accuracy: float = Field(ge=0, le=100)
    mistakes: int = Field(default=0, ge=0)
    response_time_seconds: float = Field(default=0, ge=0)
    difficulty: str = "easy"
    completed: bool = True
    played_at: Optional[datetime] = None


class MemoryIn(BaseModel):
    category: str
    title: str
    details: str = ""


class ReminderIn(BaseModel):
    title: str
    time: str
    kind: str = "Daily"


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "MemoryCare NE"}


@app.get("/api/games/results")
def get_results(session: Session = Depends(db)):
    rows = session.scalars(
        select(GameResult).order_by(GameResult.played_at.desc())
    ).all()

    return [
        {
            "id": r.id,
            "game_type": r.game_type,
            "score": r.score,
            "accuracy": r.accuracy,
            "mistakes": r.mistakes,
            "response_time_seconds": r.response_time_seconds,
            "difficulty": r.difficulty,
            "completed": bool(r.completed),
            "played_at": r.played_at.isoformat(),
        }
        for r in rows
    ]


@app.post("/api/games/results")
def create_result(
    payload: GameResultIn,
    session: Session = Depends(db),
):
    row = GameResult(
        **payload.model_dump(exclude={"played_at", "completed"}),
        completed=int(payload.completed),
        played_at=payload.played_at or datetime.now(timezone.utc),
    )

    session.add(row)
    session.commit()
    session.refresh(row)

    return {
        "id": row.id,
        "message": "Game result saved",
    }


@app.get("/api/analysis")
def analysis(session: Session = Depends(db)):
    rows = session.scalars(
        select(GameResult).order_by(GameResult.played_at.asc())
    ).all()

    if not rows:
        return {
            "cognitive_score": 0,
            "average_accuracy": 0,
            "games_completed": 0,
            "trend": "No data yet",
            "trend_delta": 0,
            "strongest_game": "—",
            "focus_area": "Getting started",
            "recommendation": "Complete a short game to begin building a personal baseline.",
            "summary": "No activity has been recorded yet.",
        }

    recent = rows[-5:]

    avg_accuracy = round(
        sum(r.accuracy for r in recent) / len(recent)
    )

    avg_score = round(
        sum(r.score for r in recent) / len(recent)
    )

    if len(rows) >= 4:
        first_group = rows[:3]
        last_group = rows[-3:]

        first_avg = sum(r.score for r in first_group) / len(first_group)
        last_avg = sum(r.score for r in last_group) / len(last_group)

        delta = round(last_avg - first_avg)

        if delta >= 5:
            trend = "Improving"
        elif delta <= -5:
            trend = "Needs gentle practice"
        else:
            trend = "Stable"
    else:
        delta = 0
        trend = "Building baseline"

    game_accuracy = {}

    for row in rows:
        game_accuracy.setdefault(row.game_type, []).append(row.accuracy)

    strongest_game = "—"

    if game_accuracy:
        strongest_game = max(
            game_accuracy,
            key=lambda name: sum(game_accuracy[name]) / len(game_accuracy[name]),
        )

        strongest_game = strongest_game.replace("_", " ").title()

    if avg_accuracy >= 85:
        focus_area = "Ready for a little more challenge"
        recommendation = "Try Medium difficulty next while keeping sessions short and comfortable."
    elif avg_accuracy >= 65:
        focus_area = "Accuracy and recall"
        recommendation = "Continue with the current difficulty and focus on accuracy before increasing challenge."
    else:
        focus_area = "Gentle accuracy practice"
        recommendation = "Repeat Easy difficulty and focus on calm, accurate responses rather than speed."

    if trend == "Improving":
        summary = (
            f"Recent performance is trending upward with an average accuracy "
            f"of {avg_accuracy}%."
        )
    elif trend == "Needs gentle practice":
        summary = (
            f"Recent results are lower than the earlier baseline. "
            f"Short, comfortable practice may be helpful."
        )
    else:
        summary = (
            f"Recent performance is relatively consistent with an average "
            f"accuracy of {avg_accuracy}%."
        )

    return {
        "cognitive_score": max(0, min(100, avg_score)),
        "average_accuracy": avg_accuracy,
        "games_completed": len(rows),
        "trend": trend,
        "trend_delta": delta,
        "strongest_game": strongest_game,
        "focus_area": focus_area,
        "recommendation": recommendation,
        "summary": summary,
    }


@app.get("/api/memories")
def get_memories(session: Session = Depends(db)):
    rows = session.scalars(
        select(Memory).order_by(Memory.id.desc())
    ).all()

    return [
        {
            "id": r.id,
            "category": r.category,
            "title": r.title,
            "details": r.details,
        }
        for r in rows
    ]


@app.post("/api/memories")
def create_memory(
    payload: MemoryIn,
    session: Session = Depends(db),
):
    row = Memory(**payload.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)

    return {"id": row.id}


@app.delete("/api/memories/{memory_id}")
def delete_memory(
    memory_id: int,
    session: Session = Depends(db),
):
    row = session.get(Memory, memory_id)

    if not row:
        raise HTTPException(404, "Memory not found")

    session.delete(row)
    session.commit()

    return {"message": "Deleted"}


@app.get("/api/reminders")
def get_reminders(session: Session = Depends(db)):
    rows = session.scalars(
        select(Reminder).order_by(Reminder.time)
    ).all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "time": r.time,
            "kind": r.kind,
            "done": bool(r.done),
        }
        for r in rows
    ]


@app.post("/api/reminders")
def create_reminder(
    payload: ReminderIn,
    session: Session = Depends(db),
):
    row = Reminder(**payload.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)

    return {"id": row.id}


@app.patch("/api/reminders/{reminder_id}")
def toggle_reminder(
    reminder_id: int,
    session: Session = Depends(db),
):
    row = session.get(Reminder, reminder_id)

    if not row:
        raise HTTPException(404, "Reminder not found")

    row.done = 0 if row.done else 1
    session.commit()

    return {"done": bool(row.done)}