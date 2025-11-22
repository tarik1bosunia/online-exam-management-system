from typing import List
from app.models.question import Question, QuestionType
from app.models.attempt import StudentAnswer

def grade_answer(question: Question, answer: StudentAnswer) -> float:
    """
    Calculates score for a single question.
    """
    # 1. Text / Image questions need manual review (score 0 for now)
    if question.q_type in [QuestionType.TEXT, QuestionType.IMAGE_UPLOAD]:
        return 0.0

    # 2. Objective Questions
    if not answer.selected_options:
        return 0.0


    def normalize(val):
        return str(val).strip().lower()

    correct_set = set(normalize(x) for x in (question.correct_answers or []))
    student_set = set(normalize(x) for x in (answer.selected_options or []))

    # Exact match required for full points
    if correct_set == student_set:
        return question.max_score
    
    return 0.0