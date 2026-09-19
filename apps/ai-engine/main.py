# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

from fastapi import FastAPI
from security import ServiceBoundary
from config import HOST, PORT
from routers import generation, dialogue, assistant

app = FastAPI(
    title="Nightasaur AI Engine",
    description="AI 精靈生成與對話引擎 — Ollama + ComfyUI",
    version="2.0.0",
)

app.add_middleware(ServiceBoundary)

app.include_router(generation.router, prefix="/api/generate", tags=["Generation"])
app.include_router(dialogue.router, prefix="/api/dialogue", tags=["Dialogue"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["Assistant"])


@app.get("/api/health")
async def health():
    """Public liveness only; provider details require private service access"""
    return {
        "status": "ok",
        "service": "Nightasaur AI Engine",
        "version": "3.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
