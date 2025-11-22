from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import List, Optional
import uuid

# Input for creating an exam
class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    
    @field_validator('end_time')
    @classmethod
    def check_dates(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('End time must be after start time')
        return v

# Input for adding questions to an exam
class ExamQuestionAdd(BaseModel):
    question_ids: List[uuid.UUID]

class ExamUpdate(BaseModel):
    is_published: Optional[bool] = None
    title: Optional[str] = None

# Output Schema
class ExamPublic(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    is_published: bool
    question_count: int = 0 # Computed field
    
    attempt_status: Optional[str] = "not_attempted" # 'not_attempted', 'in_progress', 'submitted'
    attempt_id: Optional[uuid.UUID] = None