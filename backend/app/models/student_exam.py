from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

from models.exam import Exam
from models.student_answer import StudentAnswer
from models.user import User

class ExamStatus(str, Enum):
    """
    Tracks the lifecycle of a student's exam attempt
    """
    NOT_STARTED = "not_started"    # Exam assigned but not begun
    IN_PROGRESS = "in_progress"    # Student actively taking exam
    SUBMITTED = "submitted"         # Student finished and submitted
    EXPIRED = "expired"             # Time ran out before submission

class StudentExam(SQLModel, table=True):
    """
    Each row = ONE student's ONE attempt at ONE exam
    
    Example:
    - John takes Math Exam → 1 StudentExam row
    - Jane takes Math Exam → 1 StudentExam row
    - John takes Science Exam → Another StudentExam row
    """
    
    # Primary Key
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        description="Unique identifier for this exam attempt"
    )
    
    # ═══════════════════════════════════════════════════════════
    # WHO and WHAT - Links Student to Exam
    # ═══════════════════════════════════════════════════════════
    student_id: uuid.UUID = Field(
        foreign_key="users.id",
        index=True,  # Fast: "Get all exams for student X"
        description="Which student is taking this exam"
    )
    
    exam_id: uuid.UUID = Field(
        foreign_key="exams.id",
        index=True,  # Fast: "Get all students taking exam Y"
        description="Which exam is being taken"
    )
    
    # ═══════════════════════════════════════════════════════════
    # EXAM LIFECYCLE STATUS
    # ═══════════════════════════════════════════════════════════
    status: ExamStatus = Field(
        default=ExamStatus.NOT_STARTED,
        description="""
        Current state of the exam attempt
        NOT_STARTED → IN_PROGRESS → (SUBMITTED or EXPIRED)
        """
    )
    
    # ═══════════════════════════════════════════════════════════
    # TIMING - Critical for enforcing time limits
    # ═══════════════════════════════════════════════════════════
    started_at: Optional[datetime] = Field(
        default=None,
        description="""
        When student clicked "Start Exam"
        Used to calculate deadline = started_at + exam.duration_minutes
        NULL until student starts
        """
    )
    
    submitted_at: Optional[datetime] = Field(
        default=None,
        description="""
        When student clicked "Submit"
        NULL while in progress
        Used to verify submission was within time limit
        """
    )
    
    last_activity: Optional[datetime] = Field(
        default=None,
        description="""
        Last time student interacted (answer saved/updated)
        
        CRITICAL for auto-save and resume:
        - Update on every answer change
        - Detect if student disconnected
        - Show "last saved" timestamp in UI
        """
    )
    
    # ═══════════════════════════════════════════════════════════
    # SCORING - Calculated after submission
    # ═══════════════════════════════════════════════════════════
    total_score: Optional[float] = Field(
        default=None,
        description="""
        Student's final score (sum of all graded questions)
        NULL until exam is submitted and graded
        """
    )
    
    max_possible_score: Optional[float] = Field(
        default=None,
        description="""
        Total points available in this exam
        Sum of all question.max_score values
        Used to calculate percentage: (total_score / max_possible_score) * 100
        """
    )
    
    # ═══════════════════════════════════════════════════════════
    # RELATIONSHIPS
    # ═══════════════════════════════════════════════════════════
    student: "User" = Relationship( # "Navigate to the Student's user record"
        back_populates="student_exams",
    )
    
    exam: "Exam" = Relationship( # "Navigate to the Exam configuration"
        back_populates="student_exams",
    )
    
    # One StudentExam has MANY Answers (one per question)

    answers: List["StudentAnswer"] = Relationship( # "All answers submitted for this exam attempt"
        back_populates="student_exam",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    
    
