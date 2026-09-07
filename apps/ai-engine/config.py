import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")  # 繁體中文最佳輕量模型
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://localhost:8188")
HOST = os.getenv("AI_HOST", "0.0.0.0")
PORT = int(os.getenv("AI_PORT", "8000"))