from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.api.deps import get_current_admin
from app.models.user import User
from app.models.question import Question
from app.schemas.question_schema import QuestionPublic
from app.services.excel_service import parse_excel_questions

router = APIRouter()

@router.post("/import", status_code=201)
def import_questions(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin) # Only Admins
):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are allowed")
    
    questions, errors = parse_excel_questions(file)
    
    if questions:
        session.add_all(questions)
        session.commit()
    
    return {
        "message": "Import processed",
        "imported_count": len(questions),
        "errors": errors
    }

@router.get("/", response_model=List[QuestionPublic])
def list_questions(
    skip: int = 0, 
    limit: int = 100, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    statement = select(Question).offset(skip).limit(limit)
    return session.exec(statement).all()