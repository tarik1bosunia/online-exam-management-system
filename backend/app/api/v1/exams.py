from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.api.deps import get_current_admin, get_current_user
from app.models.user import User, UserRole
from app.models.exam import Exam, ExamQuestionLink
from app.models.question import Question
from app.models.attempt import StudentExamAttempt
from app.schemas.exam_schema import ExamCreate, ExamPublic, ExamQuestionAdd, ExamUpdate
import uuid

router = APIRouter()


@router.post("/", response_model=ExamPublic)
def create_exam(
    exam_in: ExamCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    exam = Exam(**exam_in.model_dump())
    session.add(exam)
    session.commit()
    session.refresh(exam)
    return exam

@router.post("/{exam_id}/questions", status_code=201)
def add_questions_to_exam(
    exam_id: uuid.UUID,
    payload: ExamQuestionAdd,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    exam = session.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    added_count = 0
    for q_id in payload.question_ids:
        if not session.get(Question, q_id):
            continue 
        existing_link = session.exec(
            select(ExamQuestionLink).where(
                ExamQuestionLink.exam_id == exam_id, 
                ExamQuestionLink.question_id == q_id
            )
        ).first()
        
        if not existing_link:
            link = ExamQuestionLink(exam_id=exam_id, question_id=q_id)
            session.add(link)
            added_count += 1
            
    session.commit()
    return {"message": f"Added {added_count} questions to exam"}

@router.patch("/{exam_id}", response_model=ExamPublic)
def update_exam(
    exam_id: uuid.UUID,
    exam_update: ExamUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    exam = session.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    exam_data = exam_update.model_dump(exclude_unset=True)
    for key, value in exam_data.items():
        setattr(exam, key, value)
        
    session.add(exam)
    session.commit()
    session.refresh(exam)
    return ExamPublic(**exam.model_dump(), question_count=len(exam.questions))

@router.get("/", response_model=List[ExamPublic])
def list_exams(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    query = select(Exam)
    if current_user.role != UserRole.ADMIN:
        query = query.where(Exam.is_published == True)
    exams = session.exec(query).all()
    
    student_attempts = {}
    if current_user.role == UserRole.STUDENT:
        attempts = session.exec(
            select(StudentExamAttempt).where(StudentExamAttempt.student_id == current_user.id)
        ).all()
        for att in attempts:
            student_attempts[att.exam_id] = att
    result = []
    for ex in exams:
        attempt = student_attempts.get(ex.id)
        
        # Determine status
        status = "not_attempted"
        att_id = None
        
        if attempt:
            status = attempt.status # 'in_progress' or 'submitted'
            att_id = attempt.id
            
        result.append(ExamPublic(
            **ex.model_dump(),
            question_count=len(ex.questions),
            attempt_status=status,
            attempt_id=att_id
        ))
        
    return result