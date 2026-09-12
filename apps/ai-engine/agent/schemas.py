# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""AgentCore 輸入/輸出資料結構。

刻意使用簡單的 dataclass 而非 Pydantic model，避免與 routers 層的 API schema
耦合 —— AgentCore 是內部執行引擎，不是對外 HTTP 契約。
"""
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class AgentInput:
    """一次 agent run 的輸入。"""

    message: str
    system_prompt: Optional[str] = None
    history: list[dict] = field(default_factory=list)
    # session_id 用於 MemoryProvider 的長期上下文查找；預設 None 代表
    # 呼叫端自行管理歷史（維持現有 /dialogue、/assistant 行為不變）。
    session_id: Optional[str] = None
    # 傳給 ModelProvider.generate 的額外參數（temperature、num_predict 等）。
    model_options: dict = field(default_factory=dict)


@dataclass
class AgentOutput:
    """一次 agent run 的輸出。"""

    content: str
    # 保留 raw provider 回應與中繼資料，方便未來擴充（例如 tool 呼叫紀錄）
    # 而不必更動 AgentOutput 的既有欄位。
    metadata: dict[str, Any] = field(default_factory=dict)
