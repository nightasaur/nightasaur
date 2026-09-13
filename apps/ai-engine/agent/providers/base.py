# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""ModelProvider 抽象介面 —— AgentCore 透過此介面呼叫任何 LLM 後端。

AgentCore 本身不知道、也不應該知道底層是 Ollama、OpenAI 或其他模型服務，也
不知道 tool call 是模型「原生」支援，還是透過 prompt-based fallback 解析出
來的 —— AgentCore 只讀取 generate() 回傳的標準化 ModelResponse。

`supports_native_tool_calls()` 只是一個診斷/資訊用的 capability flag（例如
供未來的健康檢查、日誌、路由 UI 使用），AgentCore.run() 不會依賴它做任何
分支判斷；每個 ModelProvider 實作自行決定要不要用它，以及要不要在內部委派
給 agent/providers/tool_call_fallback.py 的 prompt-based adapter。
"""
from abc import ABC, abstractmethod

from agent.tool_calls import ModelResponse, ToolSpec


class ModelProvider(ABC):
    """所有模型後端（Ollama、未來的 OpenAI/Anthropic/... ）都必須實作此介面。"""

    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        tools: list[ToolSpec] | None = None,
        **options,
    ) -> ModelResponse:
        """給定 chat messages（與可選的 tool 規格），回傳標準化的
        ModelResponse。`tools` 為 None 或空列表時，回傳的 ModelResponse
        必定沒有 tool_calls（等同 v0.1 純文字問答行為）。
        """
        raise NotImplementedError

    @abstractmethod
    async def health_check(self) -> dict:
        """回報此模型後端的連線/可用狀態。"""
        raise NotImplementedError

    def supports_native_tool_calls(self) -> bool:
        """此 ModelProvider 是否具備原生 tool-calling 能力（而非透過
        prompt-based fallback 解析）。預設為 False；純資訊用途，AgentCore
        不會讀取這個值做流程分支。
        """
        return False
