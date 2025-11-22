import pandas as pd
import json

# Define the data matching your Question Model
data = [
    {
        "title": "What is 2 + 2?",
        "description": "Basic math question",
        "complexity": "Class 1",
        "type": "single_choice",

        "options": json.dumps(["3", "4", "5", "6"]),
        "correct_answers": json.dumps(["4"]),
        "max_score": 1.0,
        "tags": "math,basic"
    },
    {
        "title": "Which of the following are Prime Numbers?",
        "description": "Select all that apply",
        "complexity": "Class 5",
        "type": "multi_choice",
        "options": json.dumps(["2", "4", "6", "7", "9"]),
        "correct_answers": json.dumps(["2", "7"]),
        "max_score": 2.0,
        "tags": "math,number-theory"
    },
    {
        "title": "Explain the theory of relativity.",
        "description": "Write a short essay",
        "complexity": "Hard",
        "type": "text",
        "options": "[]", # Text questions have no options
        "correct_answers": "[]",
        "max_score": 5.0,
        "tags": "physics,science"
    }
]

# Create DataFrame
df = pd.DataFrame(data)

# Save to Excel
filename = "sample_questions.xlsx"
df.to_excel(filename, index=False)

print(f"Successfully created {filename}")