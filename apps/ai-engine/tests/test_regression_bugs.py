# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""兩個既有 bug 的 regression 測試（在 AgentCore v0.1 重構過程中被發現並修正，
與 apps/ai-engine/services/assistant_llm.py 的 commit 訊息一致）：

1. `routers/assistant.py` 原本有 `from typing import Optional, list as List`，
   這在 Python 3.12 是無效匯入，會讓整個 app import 失敗、無法啟動。
2. `services/assistant_llm.py` 原本只有 `chat(self, messages)` 與
   `general_chat(self, message, history)`，但 `routers/assistant.py` 的
   `/chat` 端點呼叫的是 `assistant_llm_service.chat(message=..., history=...)`，
   簽名對不上，該端點每次呼叫都會拋出 TypeError。

這裡直接對 routers 層做驗證，避免未來又悄悄壞掉而沒被測試發現。
"""
import importlib

import pytest
from fastapi.testclient import TestClient


def test_routers_assistant_module_imports_successfully():
    """Regression：`from typing import ... list as List` 曾讓此模組
    import 失敗（Python 3.12 下 `typing.list` 不存在），導致整個 app
    無法啟動。此處明確重新 import 一次，確保不會再壞掉。
    """
    module = importlib.import_module("routers.assistant")
    importlib.reload(module)  # 確保是「這次」真的重新執行了 import 邏輯

    assert hasattr(module, "router")


@pytest.mark.asyncio
async def test_assistant_chat_endpoint_calls_service_with_matching_signature(
    monkeypatch, fake_model_provider
):
    """Regression：`/api/assistant/chat` 呼叫
    `assistant_llm_service.chat(message=..., history=...)`，必須確保這個
    呼叫簽名真的存在且可用，端點才不會每次都 500/TypeError。
    """
    import main
    from services.assistant_llm import assistant_llm_service

    # 換掉底層 ModelProvider，讓這個測試完全不連線真實 Ollama，
    # 只驗證 router -> service -> AgentCore 這條呼叫鏈本身是否還通。
    monkeypatch.setattr(
        assistant_llm_service.agent_core, "model_provider", fake_model_provider
    )

    client = TestClient(main.app)
    response = client.post(
        "/api/assistant/chat",
        json={"message": "你好嗎？", "history": []},
    )

    assert response.status_code == 200
    assert response.json() == {"response": fake_model_provider.reply}


@pytest.mark.asyncio
async def test_dialogue_chat_endpoint_still_works(monkeypatch, fake_model_provider):
    """順帶確認 /api/dialogue/chat 這條既有呼叫鏈同樣未受影響
    （非本次修的 bug，但同屬 backward-compatibility 的核心保證）。
    """
    import main
    from services.llm import llm_service

    monkeypatch.setattr(llm_service.agent_core, "model_provider", fake_model_provider)

    client = TestClient(main.app)
    response = client.post(
        "/api/dialogue/chat",
        json={
            "spirit_info": {"name": "小火", "element": "FIRE"},
            "message": "你好嗎？",
            "history": [],
        },
    )

    assert response.status_code == 200
    assert response.json() == {"response": fake_model_provider.reply}
