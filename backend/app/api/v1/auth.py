from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth_schema import UserCreate, Token, UserPublic, TokenWithUser

router = APIRouter()

@router.post("/signup", response_model=UserPublic)
def signup(user_in: UserCreate, session: Session = Depends(get_session)):
    # 1. Check if user exists
    statement = select(User).where(User.email == user_in.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Create new user
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login", response_model=TokenWithUser)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Session = Depends(get_session)
):
    # 1. Find user
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()
    
    # 2. Verify password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # 3. Generate Token
    access_token = create_access_token(subject=user.id)
    
    # 4. Return Token AND User
    user_public = UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )

    return TokenWithUser(
        access_token=access_token, 
        token_type="bearer", 
        user=user_public 
    )