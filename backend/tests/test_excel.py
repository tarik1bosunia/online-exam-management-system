import pytest
import pandas as pd
import json
from io import BytesIO
from fastapi import UploadFile
from app.services.excel_service import parse_excel_questions
from app.models.question import QuestionType

def create_mock_excel_file(data):
    """Helper to create an in-memory Excel file from a list of dicts"""
    df = pd.DataFrame(data)
    output = BytesIO()
    # Write to Excel buffer
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)
    return output

def test_parse_valid_excel():
    # Prepare mock data
    data = [{
        "title": "What is 2+2?",
        "description": "Simple Math",
        "complexity": "Easy",
        "type": "single_choice",
        "options": json.dumps(["3", "4", "5"]),
        "correct_answers": json.dumps(["4"]),
        "max_score": 1.0,
        "tags": "math"
    }]
    
    # Create mock UploadFile
    file_buffer = create_mock_excel_file(data)
    upload_file = UploadFile(filename="test.xlsx", file=file_buffer)
    
    # Run Service
    questions, errors = parse_excel_questions(upload_file)
    
    assert len(errors) == 0
    assert len(questions) == 1
    assert questions[0].title == "What is 2+2?"
    assert questions[0].q_type == QuestionType.SINGLE_CHOICE
    assert questions[0].options == ["3", "4", "5"]

def test_parse_invalid_row():
    # Data missing required 'title'
    data = [{
        "title": None, # Invalid
        "type": "text",
        "complexity": "Hard"
    }]
    
    file_buffer = create_mock_excel_file(data)
    upload_file = UploadFile(filename="invalid.xlsx", file=file_buffer)
    
    questions, errors = parse_excel_questions(upload_file)
    
    assert len(questions) == 0
    assert len(errors) == 1
    assert "validation error" in errors[0]