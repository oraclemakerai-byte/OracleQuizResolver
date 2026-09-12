from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class QuestionType(str, Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"

class Question(BaseModel):
    id: str
    text: str
    type: QuestionType
    options: List[str]
    context: Optional[str] = None

class Answer(BaseModel):
    question_id: str
    correct_options: List[str]
    confidence: float
    model_used: str = "mistral:7b"
    response_time: float = 0.0

class QuizRequest(BaseModel):
    questions: List[Question]

class QuizResponse(BaseModel):
    answers: List[Answer]
    total_time: float