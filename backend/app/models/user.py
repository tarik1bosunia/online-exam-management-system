import uuid
from typing import Optional
from sqlmodel import Field, SQLModel
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(unique=True, index=True)
    # We will hash this password before saving
    hashed_password: str 
    full_name: Optional[str] = None
    role: UserRole = Field(default=UserRole.STUDENT)
    
    # Timestamps (Optional but good practice)
    is_active: bool = Field(default=True)