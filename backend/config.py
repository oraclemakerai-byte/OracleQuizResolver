import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Config:
    # Google Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-3.8-flash"  # Modelo actualizado
    
    # Ollama (fallback)
    OLLAMA_URL: str = "http://localhost:11434"
    MODEL_PRIMARY: str = "mistral:7b"
    
    # Delays
    MIN_DELAY_SECONDS: int = 0
    MAX_DELAY_SECONDS: int = 0
    
    # Timeouts
    GEMINI_TIMEOUT: int = 60
    OLLAMA_TIMEOUT: int = 60