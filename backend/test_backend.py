# test_backend.py
import asyncio
from ai_service import AIService
from models import Question, QuestionType
from config import Config

async def test_ollama():
    config = Config()
    ai_service = AIService(config)
    
    # Pregunta de prueba de programación
    question = Question(
        id="test_1",
        text="In Java, which keyword is used to inherit from a class?",
        type=QuestionType.SINGLE_CHOICE,
        options=[
            "implements",
            "extends",
            "inherits",
            "super"
        ]
    )
    
    print("Testing Ollama with Mistral...")
    print(f"Question: {question.text}")
    
    answers = await ai_service.solve_quiz([question])
    
    if answers:
        print(f"Answer: {answers[0].correct_options}")
        print(f"Confidence: {answers[0].confidence}")
        print(f"Time: {answers[0].response_time:.2f} seconds")
    else:
        print("Failed to get answer")

if __name__ == "__main__":
    asyncio.run(test_ollama())