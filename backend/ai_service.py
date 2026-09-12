import asyncio
import time
from typing import List, Optional
import ollama

from google import genai
from google.genai import types

from config import Config
from models import Question, Answer, QuestionType

class AIService:
    def __init__(self, config: Config):
        self.config = config
        
        if config.GEMINI_API_KEY:
            try:
                self.gemini_client = genai.Client(api_key=config.GEMINI_API_KEY)
                self.gemini_model = config.GEMINI_MODEL
                print(f"✅ Gemini configurado: {config.GEMINI_MODEL}")
            except Exception as e:
                print(f"❌ Error configurando Gemini: {e}")
                self.gemini_client = None
                self.gemini_model = None
        else:
            self.gemini_client = None
            self.gemini_model = None
            print("⚠️ No hay API key de Gemini, usando solo Ollama")
    
    async def solve_quiz(self, questions: List[Question]) -> List[Answer]:
        """Resuelve quiz usando Gemini (primario) y Ollama (fallback)"""
        answers = []
        
        for question in questions:
            # Intentar con Gemini primero
            if self.gemini_client:
                answer = await self._solve_with_gemini(question)
                if answer and answer.correct_options:
                    answers.append(answer)
                    continue
            
            # Fallback a Ollama
            answer = await self._solve_with_ollama(question)
            if answer and answer.correct_options:
                answers.append(answer)
            else:
                answers.append(Answer(
                    question_id=question.id,
                    correct_options=[],
                    confidence=0.0,
                    model_used="failed"
                ))
        
        return answers
    
    async def _solve_with_gemini(self, question: Question) -> Optional[Answer]:
        """Resuelve usando Google Gemini"""
        start_time = time.time()
        
        prompt = self._build_prompt(question)
        
        print(f"\n=== GEMINI DEBUG ===")
        print(f"Pregunta: {question.text[:100]}")
        
        try:
            response = await asyncio.wait_for(
                self._gemini_completion(prompt),
                timeout=self.config.GEMINI_TIMEOUT
            )
            
            print(f"Respuesta cruda de Gemini: '{response}'")
            
            if not response:
                print("❌ Gemini devolvió respuesta vacía")
                return None
            
            answers = self._parse_response(response, question)
            print(f"Respuestas parseadas: {answers}")
            
            if not answers:
                print("❌ No se pudieron parsear respuestas")
                return None
            
            return Answer(
                question_id=question.id,
                correct_options=answers,
                confidence=0.9,
                model_used="gemini",
                response_time=time.time() - start_time
            )
            
        except Exception as e:
            print(f"❌ Gemini error: {e}")
            return None
    
    async def _solve_with_ollama(self, question: Question) -> Optional[Answer]:
        """Resuelve usando Ollama local (fallback)"""
        start_time = time.time()
        
        prompt = self._build_prompt(question)
        
        print(f"\n=== OLLAMA DEBUG ===")
        print(f"Pregunta: {question.text[:100]}")
        
        try:
            response = await asyncio.wait_for(
                self._ollama_completion(prompt),
                timeout=self.config.OLLAMA_TIMEOUT
            )
            
            print(f"Respuesta cruda de Ollama: '{response}'")
            
            if not response:
                print("❌ Ollama devolvió respuesta vacía")
                return None
            
            answers = self._parse_response(response, question)
            print(f"Respuestas parseadas: {answers}")
            
            if not answers:
                print("❌ No se pudieron parsear respuestas")
                return None
            
            return Answer(
                question_id=question.id,
                correct_options=answers,
                confidence=0.8,
                model_used="ollama",
                response_time=time.time() - start_time
            )
            
        except Exception as e:
            print(f"❌ Ollama error: {e}")
            return None
    
    async def _gemini_completion(self, prompt: str) -> str:
        """Completación con Gemini"""
        try:
            def sync_gemini_call():
                response = self.gemini_client.models.generate_content(
                    model=self.gemini_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        max_output_tokens=200,
                    )
                )
                return response.text.strip()
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                sync_gemini_call
            )
            
            if response:
                return response
            else:
                print("Gemini devolvió texto vacío")
                return ""
            
        except Exception as e:
            print(f"Error detallado en Gemini: {type(e).__name__}: {e}")
            raise
    
    async def _ollama_completion(self, prompt: str) -> str:
        """Completación con Ollama"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ollama.chat(
                    model=self.config.MODEL_PRIMARY,
                    messages=[
                        {
                            "role": "system",
                            "content": """You are an expert in Oracle technologies, Java, SQL, and computer science.
                            For single choice questions: provide ONLY the correct answer text.
                            For multiple choice: provide ALL correct answers separated by ||.
                            For true/false: answer only True or False.
                            Be precise and concise."""
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    options={
                        "temperature": 0.1,
                        "num_predict": 100,
                    }
                )
            )
            
            return response['message']['content'].strip()
            
        except Exception as e:
            print(f"Error en Ollama completion: {e}")
            raise
    
    def _build_prompt(self, question: Question) -> str:
        """Construye prompt para la pregunta"""
        
        question_text_lower = question.text.lower()
        
        if question.type == QuestionType.TRUE_FALSE:
            instruction = "Answer with ONLY 'True' or 'False'"
        elif 'choose 2' in question_text_lower:
            instruction = "SELECT EXACTLY 2 correct answers"
        elif question.type == QuestionType.MULTIPLE_CHOICE:
            instruction = "SELECT ALL correct answers (may be multiple)"
        else:
            instruction = "SELECT ONLY ONE correct answer"
        
        if question.type == QuestionType.TRUE_FALSE:
            prompt = f"""QUESTION: {question.text}

INSTRUCTION: {instruction}

Answer:"""
        else:
            prompt = f"""QUESTION: {question.text}

INSTRUCTION: {instruction}

OPTIONS:
{self._format_options(question.options)}

IMPORTANT: Answer with the LETTER(S) of the correct option(s). For multiple answers, separate with ||.
Example: A||C

Your answer:"""
        
        return prompt
    
    def _format_options(self, options: List[str]) -> str:
        """Formatea las opciones"""
        return "\n".join([f"{chr(65+i)}. {opt}" for i, opt in enumerate(options)])
    
    def _parse_response(self, response: str, question: Question) -> List[str]:
        """Parsea la respuesta del modelo (maneja letras A, B, C, D y texto)"""
        response = response.strip()
        
        if not response:
            return []
        
        print(f"Parsing response: '{response}'")
        
        # Separar múltiples respuestas
        if "||" in response:
            parts = [ans.strip() for ans in response.split("||")]
        elif "|" in response:
            parts = [ans.strip() for ans in response.split("|")]
        elif "," in response:
            parts = [ans.strip() for ans in response.split(",")]
        elif "\n" in response:
            parts = [response.split("\n")[0].strip()]
        else:
            parts = [response]
        
        clean_answers = []
        for ans in parts:
            if not ans:
                continue
            
            # Limpiar formato
            ans = ans.strip('"\'').strip()
            
            # Si es una letra (A, B, C, D, etc.)
            if len(ans) == 1 and ans.isalpha():
                index = ord(ans.upper()) - ord('A')
                if 0 <= index < len(question.options):
                    clean_answers.append(question.options[index])
                    print(f"  Letra {ans.upper()} -> {question.options[index]}")
                continue
            
            # Si empieza con letra seguida de punto o paréntesis (A., B), etc.)
            if len(ans) > 2 and ans[0].isalpha() and ans[1] in ['.', ')', ':']:
                letter = ans[0].upper()
                index = ord(letter) - ord('A')
                if 0 <= index < len(question.options):
                    clean_answers.append(question.options[index])
                    print(f"  Letra con formato {ans} -> {question.options[index]}")
                continue
            
            # Si es texto completo, buscar coincidencia con opciones
            matched = False
            for option in question.options:
                if ans.lower() == option.lower():
                    clean_answers.append(option)
                    print(f"  Coincidencia exacta: {option}")
                    matched = True
                    break
                elif ans.lower() in option.lower():
                    clean_answers.append(option)
                    print(f"  Coincidencia parcial: '{ans}' en '{option}'")
                    matched = True
                    break
            
            # Si no coincide, intentar con las primeras palabras
            if not matched:
                for i, option in enumerate(question.options):
                    # Verificar si la respuesta contiene palabras clave de la opción
                    option_words = option.lower().split()
                    ans_words = ans.lower().split()
                    
                    common_words = set(option_words) & set(ans_words)
                    if len(common_words) >= 2:  # Al menos 2 palabras en común
                        clean_answers.append(option)
                        print(f"  Coincidencia por palabras: '{ans}' -> '{option}'")
                        break
        
        # Eliminar duplicados
        unique_answers = []
        for ans in clean_answers:
            if ans not in unique_answers:
                unique_answers.append(ans)
        
        return unique_answers