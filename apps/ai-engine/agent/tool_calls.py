# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Provider-neutral tool-calling 資料結構。

這些 dataclass 是 AgentCore 與 ModelProvider 之間唯一的契約 —— AgentCore 只
認得這裡定義的形狀，完全不知道底層是 Ollama 的 prompt-based fallback、還是
未來 OpenAI/Claude/Gemini 的原生 function-calling 格式。每個 ModelProvider
實作負責把自己的原生格式轉換成/解析出這裡的形狀。
"""
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class ToolSpec:
    """描述一個可供模型呼叫的工具，送給 ModelProvider.generate() 的 tools 參數。"""

    name: str
    description: str = ""
    # JSON-schema 風格的參數描述，供模型（或 prompt fallback）了解如何呼叫。
    parameters: dict = field(default_factory=dict)


@dataclass
class ToolCallRequest:
    """模型輸出中的一次工具呼叫請求（由 ModelProvider 正規化而來）。"""

    id: str
    name: str
    arguments: dict = field(default_factory=dict)


@dataclass
class ToolCallResult:
    """一次工具執行的結果，準備回送給模型。"""

    id: str
    name: str
    ok: bool
    # 執行成功時的原始（尚未經過 serializer 正規化的）結果，可以是任意型別，
    # 僅供 runtime/內部使用；送進 model messages 前一律要先經過
    # agent.tool_result_serializer.serialize_tool_result()。
    result: Any = None
    error: Optional[str] = None


@dataclass
class ModelResponse:
    """每個 ModelProvider.generate() 的標準化回傳型別。

    - 沒有 tool_calls：代表這是最終答案，AgentCore 應該結束 loop。
    - 有 tool_calls：AgentCore 應該執行工具、把結果送回，再呼叫一次
      generate()。content 此時通常為 None 或模型附帶的說明文字。
    """

    content: Optional[str] = None
    tool_calls: list[ToolCallRequest] = field(default_factory=list)
    # 原始 provider 回應，只做診斷/除錯用途，AgentCore 不應依賴其內容。
    raw: Any = None
