# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import HOST, PORT
from routers import generation, dialogue, assistant
from services.llm import llm_service
from services.comfyui import comfyui_service

app = FastAPI(
    title="Nightasaur AI Engine",
    description="AI 精靈生成與對話引擎 — Ollama + ComfyUI",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generation.router, prefix="/api/generate", tags=["Generation"])
app.include_router(dialogue.router, prefix="/api/dialogue", tags=["Dialogue"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["Assistant"])


@app.get("/api/health")
async def health():
    """AI Engine 健康檢查 + Ollama + ComfyUI"""
    ollama_status = await llm_service.health_check()
    comfyui_status = await comfyui_service.health_check()
    return {
        "status": "ok",
        "service": "Nightasaur AI Engine",
        "version": "3.0.0",
        "ollama": ollama_status,
        "comfyui": comfyui_status,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)