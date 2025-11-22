from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
import uuid

from models.exam import Exam
from models.question import Question

class ExamQuestion(SQLModel, table=True):
    """
    JUNCTION TABLE (also called "association table" or "link table")
    
    Why needed? Many-to-many relationship:
    - One Question can be in MANY Exams
    - One Exam can have MANY Questions
    
    Without this table, we'd have to duplicate questions for each exam!
    """
    
    # Primary Key
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        description="Unique identifier for this question-exam pairing"
    )
    
    # ═══════════════════════════════════════════════════════════
    # FOREIGN KEYS - Connect Exam and Question
    # ═══════════════════════════════════════════════════════════
    exam_id: uuid.UUID = Field(
        foreign_key="exams.id",
        index=True,  # Fast lookup: "Get all questions for exam X"
        description="Which exam this question belongs to"
    )
    
    question_id: uuid.UUID = Field(
        foreign_key="questions.id",
        index=True,
        description="Which question is included in this exam"
    )
    
    # Question Ordering
    order: int = Field(
        description="""
        Display order in the exam
        Example: order=1 for first question, order=2 for second, etc.
        
        Why important?
        - Maintains consistent question sequence for all students
        - Admin can arrange questions logically (easy → hard)
        - Questions can be shuffled by manipulating this field
        """
    )
    
    # ═══════════════════════════════════════════════════════════
    # RELATIONSHIPS - Bidirectional navigation
    # ═══════════════════════════════════════════════════════════
    exam: "Exam" = Relationship( # "Navigate to the Exam this belongs to"
        back_populates="exam_questions",
    )
    
    question: "Question" = Relationship( # "Navigate to the actual Question data"
        back_populates="exam_questions",
    )