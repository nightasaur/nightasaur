# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""pytest 共用 fixtures。

FakeModelProvider 讓 AgentCore 相關測試完全不需要連線真實 Ollama，回傳固定/
可預期的內容，只驗證 orchestration 邏輯本身。
"""
import os
import sys

# 確保可以用 `from agent import ...`、`from config import ...` 等絕對匯入
# 方式載入 apps/ai-engine 底下的模組，與 main.py/routers/services 的匯入風格
# 一致，不需要額外的套件安裝步驟。
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402

from agent.providers.base import ModelProvider  # noqa: E402


class FakeModelProvider(ModelProvider):
    """測試專用 ModelProvider，回傳固定回覆並記錄收到的 messages。"""

    def __init__(self, reply: str = "fake-reply"):
        self.reply = reply
        self.received_messages: list[list[dict]] = []
        self.received_options: list[dict] = []

    async def generate(self, messages: list[dict], **options) -> str:
        self.received_messages.append(messages)
        self.received_options.append(options)
        return self.reply

    async def health_check(self) -> dict:
        return {"status": "ok", "model": "fake-model"}


@pytest.fixture
def fake_model_provider() -> FakeModelProvider:
    return FakeModelProvider()
