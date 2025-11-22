from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, Any, List
from datetime import datetime
import uuid

from models.student_exam import StudentExam

class StudentAnswer(SQLModel, table=True):
    """
    Each row = ONE student's answer to ONE question in ONE exam attempt
    
    Example: If exam has 10 questions, one student will have 10 StudentAnswer rows
    """
    
    # Primary Key
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        description="Unique identifier for this answer"
    )
    
    # ═══════════════════════════════════════════════════════════
    # FOREIGN KEYS - Links to exam attempt and question
    # ═══════════════════════════════════════════════════════════
    student_exam_id: uuid.UUID = Field(
        foreign_key="student_exams.id",
        index=True,  # Fast: "Get all answers for this exam attempt"
        description="Which exam attempt this answer belongs to"
    )
    
    question_id: uuid.UUID = Field(
        foreign_key="questions.id",
        index=True,  # Fast: "Get all student responses to question X"
        description="Which question is being answered"
    )
    
    # ═══════════════════════════════════════════════════════════
    # ANSWER DATA - Flexible storage for different question types
    # ═══════════════════════════════════════════════════════════
    answer: Any = Field(
        sa_column=Column(JSON),
        description="""
        Student's answer - format depends on question type:
        
        SINGLE_CHOICE: "A" (string)
        MULTI_CHOICE: ["A", "C", "D"] (array)
        TEXT: "My answer text here" (string)
        IMAGE_UPLOAD: "/uploads/student123/answer456.jpg" (file path)
        
        NULL if question not answered yet (for auto-save)
        """
    )
    
    # ═══════════════════════════════════════════════════════════
    # GRADING RESULTS - Set after exam submission
    # ═══════════════════════════════════════════════════════════
    is_correct: Optional[bool] = Field(
        default=None,
        description="""
        Was the answer correct? (for objective questions only)
        
        True: Correct answer
        False: Incorrect answer
        NULL: Not graded yet (manual grading needed for text/image)
        
        Auto-populated by GradingService for choice questions
        """
    )
    
    score: Optional[float] = Field(
        default=None,
        description="""
        Points earned for this answer
        
        - Objective questions: 0 or question.max_score
        - Manual grading: Admin can award partial credit
        NULL until graded
        """
    )
    
    # ═══════════════════════════════════════════════════════════
    # TIMESTAMP - For audit and auto-save
    # ═══════════════════════════════════════════════════════════
    answered_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="""
        When answer was submitted/last updated
        
        Updated on every auto-save
        Used to track student progress through exam
        """
    )
    
    # ═══════════════════════════════════════════════════════════
    # RELATIONSHIPS
    # ═══════════════════════════════════════════════════════════
    student_exam: "StudentExam" = Relationship( # "Navigate to the parent exam attempt"
        back_populates="answers",
    )
