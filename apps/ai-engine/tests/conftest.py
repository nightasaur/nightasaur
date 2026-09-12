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
