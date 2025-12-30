from pydantic import BaseModel
from typing import List, Optional

class ProgressResponse(BaseModel):
    total_concepts: int
    mastered_concepts: int
    current_topic: Optional[str] = None
    overall_mastery: float
    average_elo: int
    level: str
    streak: int
    total_questions: int
    today_questions: int
    chapters: List[dict]
    concepts: List[dict]
    recommended_concept: Optional[dict] = None
    needs_attention: List[dict]
    recent_achievements: List[dict]
    progress_details: List[dict]
