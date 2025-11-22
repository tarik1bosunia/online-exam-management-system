from pydantic import BaseModel, field_validator, Field, ConfigDict
from typing import List, Optional, Any, Union
from app.models.question import QuestionType
import uuid
import json

class QuestionBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True) 
    # ---------------------

    title: str
    description: Optional[str] = None
    complexity: str
    
    # Matches DB model 'q_type', but outputs JSON as 'type'
    q_type: QuestionType = Field(alias="type") 
    
    options: Optional[Union[List[Any], str]] = None
    correct_answers: Optional[Union[List[Any], str]] = None
    max_score: float = 1.0
    tags: Optional[str] = None

    @field_validator('options', 'correct_answers', mode='before')
    @classmethod
    def parse_json_fields(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [] if not v else [v]
        return v

class QuestionCreate(QuestionBase):
    pass

class QuestionPublic(QuestionBase):
    id: uuid.UUID