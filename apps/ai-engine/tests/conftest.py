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
from agent.tool_calls import ModelResponse  # noqa: E402


class FakeModelProvider(ModelProvider):
    """測試專用 ModelProvider，回傳固定回覆並記錄收到的 messages/tools/options。

    - 預設行為（不傳 responses）：每次呼叫都回傳
      `ModelResponse(content=self.reply)`，等同 v0.1 的純文字問答，不含任何
      tool_calls —— 用於既有的無 tool 測試案例，維持完全不變的行為。
    - 傳入 `responses`（一個 ModelResponse 列表）可以照順序腳本化多輪回覆，
      模擬「先要求 tool call、再根據 tool 結果產生最終答案」之類的多輪流程；
      呼叫次數超過 responses 長度時，重複回傳最後一個 response（方便撰寫
      max-iteration 測試 —— 模型「一直要求同一個工具」）。
    """

    def __init__(
        self,
        reply: str = "fake-reply",
        responses: list[ModelResponse] | None = None,
    ):
        self.reply = reply
        self.responses = responses
        self.received_messages: list[list[dict]] = []
        self.received_tools: list[list] = []
        self.received_options: list[dict] = []
        self.call_count = 0

    async def generate(self, messages: list[dict], tools=None, **options) -> ModelResponse:
        self.received_messages.append(messages)
        self.received_tools.append(list(tools) if tools else [])
        self.received_options.append(options)
        self.call_count += 1

        if self.responses is not None:
            index = min(self.call_count - 1, len(self.responses) - 1)
            return self.responses[index]
        return ModelResponse(content=self.reply)

    async def health_check(self) -> dict:
        return {"status": "ok", "model": "fake-model"}


@pytest.fixture
def fake_model_provider() -> FakeModelProvider:
    return FakeModelProvider()


class FakeHttpxResponse:
    """最小的 httpx.Response 替身，只提供 OllamaModelProvider 用到的欄位。"""

    def __init__(self, status_code: int, json_data=None, text: str = ""):
        self.status_code = status_code
        self._json_data = json_data
        self.text = text

    def json(self):
        return self._json_data


@pytest.fixture
def patch_ollama_httpx_client(monkeypatch):
    """monkeypatch `httpx.AsyncClient`（在 agent.providers.ollama_provider 內部
    使用的那個），讓 OllamaModelProvider 的 HTTP contract 測試完全不連線真實
    網路。回傳一個 `configure()` 函式，可設定 post/get 要回傳的假回應或要拋出
    的例外，並記錄所有呼叫供測試斷言。
    """
    import httpx as httpx_module

    recorded_calls: list[tuple] = []

    def configure(
        post_result=None,
        post_exception: Exception | None = None,
        get_result=None,
        get_exception: Exception | None = None,
    ):
        class _FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, tb):
                return False

            async def post(self, url, json=None):
                recorded_calls.append(("post", url, json))
                if post_exception is not None:
                    raise post_exception
                return post_result

            async def get(self, url):
                recorded_calls.append(("get", url, None))
                if get_exception is not None:
                    raise get_exception
                return get_result

        monkeypatch.setattr(httpx_module, "AsyncClient", _FakeAsyncClient)
        return recorded_calls

    return configure
