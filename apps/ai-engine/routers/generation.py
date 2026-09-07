"""圖片生成路由"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.comfyui import comfyui_service

router = APIRouter()


class GenerateRequest(BaseModel):
    name: str = "精靈"
    element: str = "FIRE"
    stage: str = "EGG"
    personality: str = "friendly"
    prompt: Optional[str] = None
    seed: int = -1


class GenerateResponse(BaseModel):
    status: str
    images: list = []
    seed: int = 0
    msg: str = ""


@router.post("/image", response_model=GenerateResponse)
async def generate_image(req: GenerateRequest):
    """生成精靈圖片"""
    if req.prompt:
        result = await comfyui_service.generate_spirit_image(prompt=req.prompt, seed=req.seed)
    else:
        result = await comfyui_service.generate_spirit(
            name=req.name, element=req.element,
            stage=req.stage, personality=req.personality,
        )
    return result


@router.get("/status")
async def get_comfyui_status():
    """ComfyUI 連線狀態"""
    return await comfyui_service.health_check()