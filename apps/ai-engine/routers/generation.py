"""圖片生成路由"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import secrets
from starlette.concurrency import run_in_threadpool
from services.procedural_spirit import generate, VERSION
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
    generator: str = ""


@router.post("/image", response_model=GenerateResponse)
async def generate_image(req: GenerateRequest):
    """生成精靈圖片"""
    if os.getenv("IMAGE_GENERATOR") == "procedural":
        if req.prompt:
            raise HTTPException(status_code=422, detail="程序式生成僅支援精靈元素與成長階段")
        seed = secrets.randbelow(2_147_483_647) if req.seed < 0 else req.seed
        try:
            return await run_in_threadpool(generate, req.element, req.stage, seed)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
    if req.prompt:
        result = await comfyui_service.generate_image(prompt=req.prompt, seed=req.seed)
    else:
        result = await comfyui_service.generate_spirit(
            name=req.name, element=req.element,
            stage=req.stage,
        )
    if result.get("status") == "disabled":
        raise HTTPException(status_code=503, detail=result["msg"])
    return result


@router.get("/status")
async def get_comfyui_status():
    """ComfyUI 連線狀態"""
    if os.getenv("IMAGE_GENERATOR") == "procedural":
        return {"status": "ok", "generator": VERSION, "model_used": False}
    return await comfyui_service.health_check()