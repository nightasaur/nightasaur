# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""AgentCore 輸入/輸出資料結構。

刻意使用簡單的 dataclass 而非 Pydantic model，避免與 routers 層的 API schema
耦合 —— AgentCore 是內部執行引擎，不是對外 HTTP 契約。
"""
from dataclasses import dataclass, field
from typing import Any, Optional

from agent.execution_policy import ExecutionPolicy


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
    # v0.2：本次 run 允許的最大 tool-calling 迭代次數；None 代表使用
    # AgentCore 建構時設定的預設值，避免無限循環。
    max_tool_iterations: Optional[int] = None
    # v0.2：本次 run 覆寫用的 ExecutionPolicy；None 代表使用 AgentCore
    # 建構時設定的預設 policy（v0.2 預設為 AllowAllExecutionPolicy）。
    execution_policy: Optional[ExecutionPolicy] = None


@dataclass
class AgentOutput:
    """一次 agent run 的輸出。"""

    content: str
    # 保留 raw provider 回應與中繼資料，方便未來擴充（例如 tool 呼叫紀錄）
    # 而不必更動 AgentOutput 的既有欄位。
    # v0.2 新增的 metadata 鍵：
    #   - "tool_trace"：本次 run 執行過的每一次 tool call 的診斷紀錄
    #     （id/name/arguments/ok/result/error）。這是安全邊界之一：每個
    #     欄位都先經過
    #     agent.tool_result_serializer.build_safe_trace_value() /
    #     redact_and_truncate_text() 正規化 —— 絕不保留序列化前的原始
    #     Python 物件，字串欄位也有長度上限與敏感內容遮蔽，而不是完整
    #     原文，避免 arbitrary object 或機敏文字（token/password/email）
    #     被無限制暴露在可能對外回傳/記錄的 trace 裡。
    #   - "iterations"：本次 run 實際執行的 tool-calling 迭代次數。
    metadata: dict[str, Any] = field(default_factory=dict)
