# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""ModelProvider 抽象介面 —— AgentCore 透過此介面呼叫任何 LLM 後端。

AgentCore 本身不知道、也不應該知道底層是 Ollama、OpenAI 或其他模型服務。
"""
from abc import ABC, abstractmethod


class ModelProvider(ABC):
    """所有模型後端（Ollama、未來的 OpenAI/Anthropic/... ）都必須實作此介面。"""

    @abstractmethod
    async def generate(self, messages: list[dict], **options) -> str:
        """給定 chat messages，回傳模型產生的文字內容。"""
        raise NotImplementedError

    @abstractmethod
    async def health_check(self) -> dict:
        """回報此模型後端的連線/可用狀態。"""
        raise NotImplementedError
