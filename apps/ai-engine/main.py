# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

import os
import re

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from starlette.responses import JSONResponse
from agent.providers.production_ollama import InferenceUnavailable, ProductionOllamaModelProvider
from security import ServiceBoundary
from config import HOST, PORT
from routers import generation, dialogue, assistant

app = FastAPI(
    title="Nightasaur AI Engine",
    description="AI 精靈生成與對話引擎 — Ollama + ComfyUI",
    version="2.0.0",
)

app.add_middleware(ServiceBoundary)


@app.exception_handler(InferenceUnavailable)
async def unavailable_handler(request, exc):
    return JSONResponse({"detail": "AI inference unavailable", "code": exc.code}, status_code=503)


class InferenceCheck(BaseModel):
    challenge: str


@app.post("/api/ops/verify-inference")
async def verify_inference(request: InferenceCheck):
    """Service-authenticated synthetic check; no user records or model text returned."""
    from services.assistant_llm import assistant_llm_service
    provider = assistant_llm_service.agent_core.model_provider
    if not isinstance(provider, ProductionOllamaModelProvider):
        raise HTTPException(503, "Strict production inference is not enabled")
    if not re.fullmatch(r"[0-9a-f]{32}", request.challenge):
        raise HTTPException(422, "A synthetic 32-character hexadecimal challenge is required")
    result = await provider.generate([
        {"role": "user", "content": "Repeat this code exactly: " + request.challenge}
    ], temperature=0, num_predict=80, response_schema={
        "type": "object", "properties": {"challenge": {"type": "string", "enum": [request.challenge]}},
        "required": ["challenge"], "additionalProperties": False,
    })
    if request.challenge not in (result.content or ""):
        raise InferenceUnavailable("challenge_not_reproduced")
    return {"verified": True, "scope": "synthetic_inference_connectivity",
            "model": provider.model, "digest": os.getenv("OLLAMA_EXPECTED_DIGEST", ""),
            "candidate": os.getenv("RAILWAY_GIT_COMMIT_SHA", "unknown"),
            "generated_tokens": result.raw["eval_count"]}

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
