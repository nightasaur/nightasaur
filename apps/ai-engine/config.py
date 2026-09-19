import os
from dotenv import load_dotenv
from model_policy import validate_model_selection

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = validate_model_selection(os.getenv("OLLAMA_MODEL", ""))
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://localhost:8188")
HOST = os.getenv("AI_HOST", "0.0.0.0")
PORT = int(os.getenv("AI_PORT", "8000"))
