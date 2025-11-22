
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, desc
from datetime import datetime
import uuid

from app.core.database import get_session
from app.api.deps import get_current_user, get_current_admin
from app.models.user import User, UserRole
from app.models.exam import Exam
from app.models.question import Question, QuestionType # Make sure QuestionType is imported
from app.models.attempt import StudentExamAttempt, StudentAnswer, AttemptStatus
from app.schemas.attempt_schema import (
    AttemptState, 
    AnswerSave, 
    AttemptResult, 
    ExamPaperQuestion, 
    AttemptPublic, 
    AttemptReview, 
    QuestionReview,
    GradeUpdate
)
from app.services.grading_service import grade_answer

router = APIRouter()

# ... (Keep start_or_resume_exam and save_answer exactly as they are)
@router.post("/start/{exam_id}", response_model=AttemptState)
def start_or_resume_exam(
    exam_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    # ... (Existing code)
    exam = session.get(Exam, exam_id)
    if not exam or not exam.is_published:
        raise HTTPException(status_code=404, detail="Exam not found or not active")

    statement = select(StudentExamAttempt).where(
        StudentExamAttempt.student_id == user.id,
        StudentExamAttempt.exam_id == exam_id
    )
    attempt = session.exec(statement).first()

    if not attempt:
        attempt = StudentExamAttempt(student_id=user.id, exam_id=exam_id)
        session.add(attempt)
        session.commit()
        session.refresh(attempt)
    
    if attempt.status == AttemptStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="You have already submitted this exam")

    now = datetime.now()
    time_passed = (now - attempt.start_time).total_seconds()
    total_duration_sec = exam.duration_minutes * 60
    remaining_seconds = max(0, total_duration_sec - time_passed)

    saved_answers = []
    for ans in attempt.answers:
        saved_answers.append({
            "question_id": ans.question_id,
            "selected_options": ans.selected_options,
            "text_answer": ans.text_answer
        })

    questions_payload = []
    for q in exam.questions:
        questions_payload.append(ExamPaperQuestion(
            id=q.id,
            title=q.title,
            type=q.q_type,
            options=q.options,
            max_score=q.max_score
        ))

    return AttemptState(
        attempt_id=attempt.id,
        exam_title=exam.title,
        start_time=attempt.start_time,
        duration_minutes=exam.duration_minutes,
        remaining_seconds=remaining_seconds,
        questions=questions_payload,
        saved_answers=saved_answers
    )

@router.post("/{attempt_id}/save", status_code=200)
def save_answer(
    attempt_id: uuid.UUID,
    payload: AnswerSave,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    # ... (Existing code)
    attempt = session.get(StudentExamAttempt, attempt_id)
    if not attempt or attempt.student_id != user.id:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status == AttemptStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Exam is already submitted")

    stmt = select(StudentAnswer).where(
        StudentAnswer.attempt_id == attempt_id,
        StudentAnswer.question_id == payload.question_id
    )
    answer_db = session.exec(stmt).first()
    
    if not answer_db:
        answer_db = StudentAnswer(attempt_id=attempt_id, question_id=payload.question_id)

    answer_db.selected_options = payload.selected_options
    answer_db.text_answer = payload.text_answer
    
    session.add(answer_db)
    session.commit()
    return {"message": "Saved"}


@router.post("/{attempt_id}/submit", response_model=AttemptResult)
def submit_exam(
    attempt_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    attempt = session.get(StudentExamAttempt, attempt_id)
    if not attempt or attempt.student_id != user.id:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.status == AttemptStatus.SUBMITTED:
        exam = session.get(Exam, attempt.exam_id)
        max_score = sum(q.max_score for q in exam.questions) if exam else 0
        return AttemptResult(
            attempt_id=attempt.id, 
            status=attempt.status, 
            total_score=attempt.total_score,
            max_possible_score=max_score
        )

    total_score = 0.0
    exam = session.get(Exam, attempt.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    question_map = {q.id: q for q in exam.questions}

    for answer in attempt.answers:
        question = question_map.get(answer.question_id)
        if question:
            # Auto-grade logic
            score = grade_answer(question, answer)
            answer.score_awarded = score
            answer.is_correct = (score == question.max_score)
            

            # Objective questions are automatically graded. Text/Image are NOT.
            if question.q_type in [QuestionType.SINGLE_CHOICE, QuestionType.MULTI_CHOICE]:
                answer.is_graded = True
            else:
                answer.is_graded = False # Explicitly false for text questions
            
            total_score += score
            session.add(answer)

    attempt.status = AttemptStatus.SUBMITTED
    attempt.submit_time = datetime.now()
    attempt.total_score = total_score
    
    session.add(attempt)
    session.commit()
    session.refresh(attempt)

    return AttemptResult(
        attempt_id=attempt.id,
        status=attempt.status,
        total_score=total_score,
        max_possible_score=sum(q.max_score for q in exam.questions)
    )

# ... (Keep get_my_attempts and get_exam_results as is)
@router.get("/history", response_model=List[AttemptPublic])
def get_my_attempts(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    statement = select(StudentExamAttempt).where(
        StudentExamAttempt.student_id == user.id
    ).order_by(desc(StudentExamAttempt.start_time))
    
    attempts = session.exec(statement).all()
    
    results = []
    for attempt in attempts:
        exam = session.get(Exam, attempt.exam_id)
        if not exam:
            continue
        max_score = sum(q.max_score for q in exam.questions)
        results.append(AttemptPublic(
            id=attempt.id,
            exam_title=exam.title,
            start_time=attempt.start_time,
            submit_time=attempt.submit_time,
            status=attempt.status,
            total_score=attempt.total_score,
            max_possible_score=max_score
        ))
    return results

@router.get("/exam/{exam_id}", response_model=List[AttemptPublic])
def get_exam_results(
    exam_id: uuid.UUID,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    statement = select(StudentExamAttempt).where(
        StudentExamAttempt.exam_id == exam_id
    ).order_by(desc(StudentExamAttempt.total_score))
    
    attempts = session.exec(statement).all()
    results = []
    exam = session.get(Exam, exam_id)
    if not exam: 
        return []
    max_score = sum(q.max_score for q in exam.questions)

    for attempt in attempts:
        results.append(AttemptPublic(
            id=attempt.id,
            exam_title=exam.title,
            start_time=attempt.start_time,
            submit_time=attempt.submit_time,
            status=attempt.status,
            total_score=attempt.total_score,
            max_possible_score=max_score
        ))
    return results


@router.get("/{attempt_id}", response_model=AttemptReview)
def get_attempt_review(
    attempt_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    attempt = session.get(StudentExamAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.student_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view this result")
        
    exam = session.get(Exam, attempt.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    answers_map = {a.question_id: a for a in attempt.answers}
    
    question_reviews = []
    for q in exam.questions:
        user_ans = answers_map.get(q.id)
        question_reviews.append(QuestionReview(
            id=q.id,
            title=q.title,
            description=q.description,
            type=q.q_type,
            options=q.options,
            correct_answers=q.correct_answers,
            selected_options=user_ans.selected_options if user_ans else None,
            text_answer=user_ans.text_answer if user_ans else None,
            score_awarded=user_ans.score_awarded if user_ans else 0.0,
            max_score=q.max_score,
            is_correct=user_ans.is_correct if user_ans else False,
            

            is_graded=user_ans.is_graded if user_ans else False
        ))
        
    return AttemptReview(
        attempt_id=attempt.id,
        exam_title=exam.title,
        start_time=attempt.start_time,
        submit_time=attempt.submit_time,
        total_score=attempt.total_score,
        max_possible_score=sum(q.max_score for q in exam.questions),
        questions=question_reviews
    )


@router.patch("/{attempt_id}/grade/{question_id}", response_model=AttemptReview)
def manual_grade_answer(
    attempt_id: uuid.UUID,
    question_id: uuid.UUID,
    grade_data: GradeUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    statement = select(StudentAnswer).where(
        StudentAnswer.attempt_id == attempt_id,
        StudentAnswer.question_id == question_id
    )
    answer = session.exec(statement).first()
    
    attempt = session.get(StudentExamAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if not answer:
        answer = StudentAnswer(attempt_id=attempt_id, question_id=question_id, score_awarded=0)
        session.add(answer)
        session.commit()
        session.refresh(answer)

    answer.score_awarded = grade_data.score
    answer.is_graded = True
    
    session.add(answer)
    session.commit()
    
    new_total = sum((a.score_awarded or 0) for a in attempt.answers)
    attempt.total_score = new_total
    
    session.add(attempt)
    session.commit()
    
    return get_attempt_review(attempt_id, session, admin)