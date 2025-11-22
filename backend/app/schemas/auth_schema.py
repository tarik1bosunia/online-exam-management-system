from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
import uuid

# What the user sends to Register
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    role: UserRole = UserRole.STUDENT # Default to Student

# What the user sends to Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# What the API returns (The Token)
class Token(BaseModel):
    access_token: str
    token_type: str

# What the API returns as User Profile (hiding password)
class UserPublic(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None = None
    role: UserRole
    

class TokenWithUser(BaseModel):
    access_token: str
    token_type: str
    user: UserPublic