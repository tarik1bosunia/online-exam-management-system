import pytest
from uuid import uuid4
from app.models.question import Question, QuestionType
from app.models.attempt import StudentAnswer
from app.services.grading_service import grade_answer

def test_grade_single_choice_correct():
    question = Question(
        title="Test",
        type=QuestionType.SINGLE_CHOICE,
        correct_answers=["A"],
        max_score=1.0
    )
    answer = StudentAnswer(attempt_id=uuid4(), question_id=uuid4(), selected_options=["A"])
    
    score = grade_answer(question, answer)
    score = grade_answer(question, answer)
    assert score == 1.0

def test_grade_single_choice_incorrect():
    question = Question(
        title="Test",
        type=QuestionType.SINGLE_CHOICE,
        correct_answers=["A"],
        max_score=1.0
    )
    answer = StudentAnswer(attempt_id=uuid4(), question_id=uuid4(), selected_options=["B"])
    
    score = grade_answer(question, answer)
    score = grade_answer(question, answer)
    assert score == 0.0

def test_grade_multi_choice_exact_match():
    question = Question(
        title="Test",
        type=QuestionType.MULTI_CHOICE,
        correct_answers=["A", "B"],
        max_score=2.0
    )
    answer = StudentAnswer(attempt_id=uuid4(), question_id=uuid4(), selected_options=["B", "A"])
    
    score = grade_answer(question, answer)
    score = grade_answer(question, answer)
    assert score == 2.0

def test_grade_multi_choice_partial_fail():
    # Requirement implies strict grading (auto-graded) usually means exact match
    # unless partial credit logic is explicitly requested. 
    # Our current logic is exact match.
    question = Question(
        title="Test",
        type=QuestionType.MULTI_CHOICE,
        correct_answers=["A", "B"],
        max_score=2.0
    )
    answer = StudentAnswer(attempt_id=uuid4(), question_id=uuid4(), selected_options=["A"]) # Missing B
    
    score = grade_answer(question, answer)
    score = grade_answer(question, answer)
    assert score == 0.0

def test_grade_text_question():
    # Text questions should not be auto-graded (score 0)
    question = Question(
        title="Essay",
        type=QuestionType.TEXT,
        correct_answers=[],
        max_score=5.0
    )
    answer = StudentAnswer(attempt_id=uuid4(), question_id=uuid4(), text_answer="This is my essay")
    
    score = grade_answer(question, answer)
    score = grade_answer(question, answer)
    assert score == 0.0