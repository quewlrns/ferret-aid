
import logging
from uuid import UUID
from typing import Annotated, Literal, Optional, Any
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from database import supabase
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Hackathon Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Backend работает!"}


@app.get("/test-db")
def test_db():
    supabase.table("mood_entries").select("id").limit(1).execute()
    return {"connected": True, "message": "Supabase доступен"}


class MoodRequest(BaseModel):
    mood: Literal["happy", "neutral", "sad"]
    session_id: Optional[str] = None
    reflection: Optional[str] = None


@app.post("/moods")
def save_mood(data: MoodRequest):
    try:
        result = supabase.table("mood_entries").insert({
            "mood": data.mood,
            "session_id": data.session_id,
            "reflection": data.reflection,
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"success": True, "data": result.data}




MIN_ANSWER = 0
MAX_ANSWER = 4

# Answer: integer from 0 to 4 or "na"
Answer = Annotated[int, Field(ge=MIN_ANSWER, le=MAX_ANSWER)] | Literal["na"]


class CategoryScore(BaseModel):
    category: str
    # None when all answers in the category are "na"
    score: float | None


class AssessmentRequest(BaseModel):
    session_id: UUID
    answers: dict[str, Answer]
    category_scores: list[CategoryScore]


@app.post("/assessments")
def save_assessment(data: AssessmentRequest):
    try:
        result = supabase.table("assessment_results").insert({
            "session_id": str(data.session_id),
            "assessment_code": "academic-pressure",
            "answers": data.answers,
            "category_scores": [
                category.model_dump()
                for category in data.category_scores
            ],
        }).execute()

    except Exception:
        logger.exception("Failed to save assessment")
        raise HTTPException(
            status_code=500,
            detail="Failed to save assessment results"
        )
    
    return {"success": True, "data": result.data}





import logging
from uuid import UUID

from fastapi import HTTPException, Query

logger = logging.getLogger(__name__)


def fetch_by_session(
    table: str,
    columns: str,
    order_col: str,
    session_id: UUID,
    limit: int,
) -> dict:
    try:
        result = (
            supabase.table(table)
            .select(columns)
            .eq("session_id", str(session_id))
            .order(order_col, desc=True)
            .limit(limit)
            .execute()
        )
        return {"data": result.data}

    except Exception:
        logger.exception("Failed to fetch %s", table)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve history",
        )


@app.get("/moods")
def get_moods(
    session_id: UUID,
    limit: int = Query(default=100, ge=1, le=500),
):
    return fetch_by_session(
        table="mood_entries",
        columns="id, mood, reflection, created_at",
        order_col="created_at",
        session_id=session_id,
        limit=limit,
    )


@app.get("/assessments")
def get_assessments(
    session_id: UUID,
    limit: int = Query(default=50, ge=1, le=200),
):
    return fetch_by_session(
        table="assessment_results",
        columns="id, assessment_code, answers, category_scores, completed_at",
        order_col="completed_at",
        session_id=session_id,
        limit=limit,
    )
