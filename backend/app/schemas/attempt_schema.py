from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
import uuid
from app.models.attempt import AttemptStatus

# Payload for "Auto-save"
class AnswerSave(BaseModel):
    question_id: uuid.UUID
    selected_options: Optional[List[Any]] = None
    text_answer: Optional[str] = None

# Response for "Start Exam" (Includes questions but HIDES correct answers)
class ExamPaperQuestion(BaseModel):
    id: uuid.UUID
    title: str
    type: str
    options: Optional[List[Any]] = None
    max_score: float

class AttemptState(BaseModel):
    attempt_id: uuid.UUID
    exam_title: str
    start_time: datetime
    duration_minutes: int
    remaining_seconds: float
    questions: List[ExamPaperQuestion]
    # For resume: return previously saved answers
    saved_answers: Optional[List[dict]] = None 

class AttemptPublic(BaseModel):
    id: uuid.UUID
    exam_title: str
    start_time: datetime
    submit_time: Optional[datetime] = None
    status: AttemptStatus
    total_score: float
    max_possible_score: float = 0.0 # We will compute this


class AttemptResult(BaseModel):
    attempt_id: uuid.UUID
    status: AttemptStatus
    total_score: float
    max_possible_score: float
    

class QuestionReview(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    type: str
    options: Optional[List[Any]] = None
    correct_answers: Optional[List[Any]] = None # Revealed in review
    selected_options: Optional[List[Any]] = None # Student answer
    text_answer: Optional[str] = None # Student answer
    score_awarded: float
    max_score: float
    is_correct: bool
    is_graded: bool = False

class AttemptReview(BaseModel):
    attempt_id: uuid.UUID
    exam_title: str
    start_time: datetime
    submit_time: Optional[datetime]
    total_score: float
    max_possible_score: float
    questions: List[QuestionReview]


class GradeUpdate(BaseModel):
    score: float