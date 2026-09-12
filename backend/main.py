from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
import json
import os
from typing import List, Dict

from config import Config
from models import QuizRequest, QuizResponse, Answer, Question
from ai_service import AIService

app = FastAPI(title="Oracle Quiz Solver")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = Config()
ai_service = AIService(config)

# Archivo de base de conocimiento
KNOWLEDGE_FILE = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
print(f"📁 Base de conocimiento: {KNOWLEDGE_FILE}")

def load_knowledge_base() -> Dict:
    """Carga la base de conocimiento"""
    if os.path.exists(KNOWLEDGE_FILE):
        try:
            with open(KNOWLEDGE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_knowledge_base(knowledge: Dict):
    """Guarda la base de conocimiento"""
    with open(KNOWLEDGE_FILE, 'w', encoding='utf-8') as f:
        json.dump(knowledge, f, ensure_ascii=False, indent=2)

def normalize_question(text: str) -> str:
    """Normaliza el texto de la pregunta para comparación"""
    return ' '.join(text.lower().split())

@app.post("/solve", response_model=QuizResponse)
async def solve_quiz(request: QuizRequest):
    start_time = time.time()
    
    knowledge = load_knowledge_base()
    
    answers = []
    
    for question in request.questions:
        normalized = normalize_question(question.text)
        
        # Verificar si tenemos información sobre esta pregunta
        if normalized in knowledge:
            incorrect_answers = knowledge[normalized].get('incorrect_answers', [])
            
            if incorrect_answers:
                print(f"⚠️ Pregunta conocida con respuestas incorrectas previas")
                print(f"   Respuestas a evitar: {incorrect_answers}")
                
                # Filtrar las opciones incorrectas
                filtered_options = [opt for opt in question.options if opt not in incorrect_answers]
                
                if filtered_options:
                    # Crear pregunta con solo opciones no incorrectas
                    filtered_question = Question(
                        id=question.id,
                        text=question.text,
                        type=question.type,
                        options=filtered_options,
                        context=question.context
                    )
                    
                    # Usar IA con opciones filtradas
                    answer = await ai_service.solve_quiz([filtered_question])
                    
                    if answer and answer[0].correct_options:
                        answers.append(Answer(
                            question_id=question.id,
                            correct_options=answer[0].correct_options,
                            confidence=0.95,
                            model_used="filtered_by_knowledge",
                            response_time=0.0
                        ))
                        continue
            
            # Si no hay respuestas incorrectas guardadas, usar IA normal
            answer = await ai_service.solve_quiz([question])
            if answer and answer[0].correct_options:
                answers.append(answer[0])
            else:
                answers.append(Answer(
                    question_id=question.id,
                    correct_options=[],
                    confidence=0.0,
                    model_used="failed"
                ))
        else:
            # Pregunta nueva - usar IA normal
            answer = await ai_service.solve_quiz([question])
            if answer and answer[0].correct_options:
                answers.append(answer[0])
            else:
                answers.append(Answer(
                    question_id=question.id,
                    correct_options=[],
                    confidence=0.0,
                    model_used="failed"
                ))
    
    total_time = time.time() - start_time
    
    return QuizResponse(
        answers=answers,
        total_time=total_time
    )

@app.post("/learn")
async def learn_from_mistakes(data: Dict):
    """Guarda las respuestas incorrectas del usuario"""
    try:
        knowledge = load_knowledge_base()
        
        mistakes = data.get('mistakes', [])
        
        for mistake in mistakes:
            question_text = normalize_question(mistake['question'])
            incorrect_answer = mistake.get('incorrect_answer', '')
            
            if question_text not in knowledge:
                knowledge[question_text] = {
                    'incorrect_answers': []
                }
            
            # Agregar la respuesta incorrecta si no existe
            if incorrect_answer and incorrect_answer not in knowledge[question_text]['incorrect_answers']:
                knowledge[question_text]['incorrect_answers'].append(incorrect_answer)
                print(f"📚 Guardada respuesta incorrecta para: {mistake['question'][:50]}...")
                print(f"   Respuesta incorrecta: {incorrect_answer[:50]}")
        
        save_knowledge_base(knowledge)
        
        return {"status": "success", "learned": len(mistakes)}
        
    except Exception as e:
        print(f"Error en /learn: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/knowledge_count")
async def get_knowledge_count():
    """Retorna cuántas preguntas conocemos"""
    knowledge = load_knowledge_base()
    return {"count": len(knowledge)}

@app.get("/health")
async def health_check():
    knowledge = load_knowledge_base()
    return {
        "status": "healthy",
        "gemini_available": bool(config.GEMINI_API_KEY),
        "gemini_model": config.GEMINI_MODEL if config.GEMINI_API_KEY else None,
        "knowledge_base": len(knowledge)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)