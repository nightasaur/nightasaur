# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""通用 AI 助手路由 — 精靈模式外的通用對話、程式協助、文件分析、翻譯"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from services.assistant_llm import assistant_llm_service

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class CodeRequest(BaseModel):
    code: str
    language: str = "python"
    task: str = "explain"  # explain, debug, optimize, rewrite


class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "auto"
    target_lang: str = "zh-TW"


class DocumentRequest(BaseModel):
    content: str
    doc_type: str = "text"  # text, code, markdown
    task: str = "summarize"  # summarize, analyze, extract


@router.post("/chat")
async def general_chat(req: ChatRequest):
    """通用 AI 問答 — 像 ChatGPT 一樣回應"""
    response = await assistant_llm_service.chat(
        message=req.message,
        history=req.history,
    )
    return {"response": response}


@router.post("/code")
async def code_assistance(req: CodeRequest):
    """程式碼協助：解釋、除錯、優化、重寫"""
    result = await assistant_llm_service.code_assistance(
        code=req.code,
        language=req.language,
        task=req.task,
    )
    return {"result": result}


@router.post("/translate")
async def translate(req: TranslateRequest):
    """多語言翻譯"""
    translation = await assistant_llm_service.translate(
        text=req.text,
        source_lang=req.source_lang,
        target_lang=req.target_lang,
    )
    return {"translation": translation}


@router.post("/document")
async def document_analysis(req: DocumentRequest):
    """文件分析：摘要、分析、提取"""
    result = await assistant_llm_service.document_analysis(
        content=req.content,
        doc_type=req.doc_type,
        task=req.task,
    )
    return {"result": result}


@router.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    """圖片分析（基礎版 — 描述圖片內容）"""
    contents = await image.read()
    # 將圖片轉為 base64 用 LLM 分析
    import base64
    b64 = base64.b64encode(contents).decode("utf-8")
    result = await assistant_llm_service.analyze_image(b64)
    return {"result": result}