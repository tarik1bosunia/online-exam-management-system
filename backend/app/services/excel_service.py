import pandas as pd
from typing import List, Tuple
from fastapi import UploadFile, HTTPException
from app.schemas.question_schema import QuestionCreate
from app.models.question import Question

def parse_excel_questions(file: UploadFile) -> Tuple[List[Question], List[str]]:
    """
    Parses an uploaded Excel file and returns a list of Question models.
    Returns: (valid_questions, error_logs)
    """
    try:
        # Read the uploaded Excel file into a Pandas DataFrame
        df = pd.read_excel(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {str(e)}")

    valid_questions = []
    errors = []

    # Iterate through each row in the DataFrame
    for index, row in df.iterrows():
        try:
            # 1. Clean up NaN values (replace with None for Pydantic compatibility)
            row_dict = row.where(pd.notnull(row), None).to_dict()
            
            # 2. Validate the row data using the Pydantic Schema
            # This handles JSON parsing for 'options' and 'correct_answers' automatically via the validator
            # It also maps the 'type' column from Excel to 'q_type' in the object
            q_data = QuestionCreate(**row_dict)
            
            # 3. Convert the validated data to the Database Model
            db_question = Question(
                title=q_data.title,
                description=q_data.description,
                complexity=q_data.complexity,
                q_type=q_data.q_type,
                options=q_data.options,
                correct_answers=q_data.correct_answers,
                max_score=q_data.max_score,
                tags=q_data.tags
            )
            
            valid_questions.append(db_question)
            
        except Exception as e:

            errors.append(f"Row {index + 2}: {str(e)}")

    return valid_questions, errors