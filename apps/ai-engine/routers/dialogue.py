"""精靈對話路由"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.llm import llm_service

router = APIRouter()


class ChatRequest(BaseModel):
    spirit_info: dict
    message: str
    history: list[dict] = []


class StoryRequest(BaseModel):
    prompt: str


@router.post("/chat")
async def chat_with_spirit(req: ChatRequest):
    """與精靈對話 — 真實 Ollama 串接，含歷史上下文"""
    response = await llm_service.generate_dialogue(
        spirit_info=req.spirit_info,
        message=req.message,
        history=req.history,
    )
    return {"response": response}


@router.post("/story")
async def generate_story(req: StoryRequest):
    """生成精靈背景故事"""
    story = await llm_service.generate_story(req.prompt)
    return {"story": story}