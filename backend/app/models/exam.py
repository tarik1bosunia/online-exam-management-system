import uuid
from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship
from app.models.question import Question

# Join Table for Many-to-Many relationship
class ExamQuestionLink(SQLModel, table=True):
    exam_id: uuid.UUID = Field(foreign_key="exam.id", primary_key=True)
    question_id: uuid.UUID = Field(foreign_key="question.id", primary_key=True)

class Exam(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    title: str
    description: Optional[str] = None
    
    # Time Window logic
    start_time: datetime
    end_time: datetime
    duration_minutes: int # How long the student has once they start
    
    is_published: bool = Field(default=False)
    
    # Relationships
    questions: List[Question] = Relationship(link_model=ExamQuestionLink)