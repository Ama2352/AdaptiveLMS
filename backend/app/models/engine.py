from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from ..core.config import MASTERY_THRESHOLD

class NextQuestionRequest(BaseModel):
    student_id: UUID

class SubmitAnswerRequest(BaseModel):
    student_id: UUID
    question_id: str
    is_correct: bool

class QuestionResponse(BaseModel):
    question_id: str
    concept_id: str
    content_text: str
    options: List[dict]
    difficulty_elo: int

class StatusResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[QuestionResponse] = None

class SubmitResponse(BaseModel):
    status: str
    old_elo: float
    new_elo: float
    elo_change: float
    is_mastered: bool
    mastery_threshold: int = MASTERY_THRESHOLD
