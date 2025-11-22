import uuid
from typing import List, Optional, Any
from sqlmodel import Field, SQLModel
from sqlalchemy import JSON, Column
from enum import Enum

class QuestionType(str, Enum):
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"
    TEXT = "text"
    IMAGE_UPLOAD = "image_upload"

class Question(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    title: str
    description: Optional[str] = None
    complexity: str = Field(default="Class 1")  # e.g., Class 1, Hard, Easy
    q_type: QuestionType = Field(alias="type")   # "type" is reserved in Python, mapped to "type" column if needed
    
    # Store options as a list of strings or objects (["A", "B"] or [{"id":1, "text":"A"}])
    options: Optional[List[Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Store correct answers securely (Hidden from student API responses ideally)
    correct_answers: Optional[List[Any]] = Field(default=None, sa_column=Column(JSON))
    
    max_score: float = Field(default=1.0)
    tags: Optional[str] = None  # CSV string of tags