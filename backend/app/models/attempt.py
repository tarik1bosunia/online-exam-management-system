import uuid
from datetime import datetime
from typing import List, Optional, Any
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import JSON, Column
from enum import Enum
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question

class AttemptStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"

class StudentAnswer(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    attempt_id: uuid.UUID = Field(foreign_key="studentexamattempt.id")
    question_id: uuid.UUID = Field(foreign_key="question.id")
    
    # The student's answer
    selected_options: Optional[List[Any]] = Field(default=None, sa_column=Column(JSON))
    text_answer: Optional[str] = None
    
    # Grading result
    score_awarded: float = 0.0
    is_correct: bool = False
    
    is_graded: bool = Field(default=False) # For manual grading tracking

class StudentExamAttempt(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="user.id")
    exam_id: uuid.UUID = Field(foreign_key="exam.id")
    
    start_time: datetime = Field(default_factory=datetime.now)
    submit_time: Optional[datetime] = None
    status: AttemptStatus = Field(default=AttemptStatus.IN_PROGRESS)
    
    total_score: float = 0.0
    
    # Relationships
    answers: List[StudentAnswer] = Relationship(sa_relationship_kwargs={"cascade": "all, delete"})