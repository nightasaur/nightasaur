# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""ExecutionPolicy —— 工具執行前的最小 policy boundary。

AgentCore 在看到模型的 tool call 請求後，不應該無條件呼叫
ToolRegistry.execute()。每一次工具呼叫都必須先經過 ExecutionPolicy.evaluate()
決定 allow / deny / confirmation_required。

v0.2 預設實作 AllowAllExecutionPolicy 全部放行，行為等同「一律執行」，不做
任何 permission UI 或 human-in-the-loop 流程 —— 但這個邊界必須存在，才能在
未來掛上高風險工具、side-effect 工具、企業政策、人工核可流程時，不需要更動
AgentCore 的 loop 邏輯。
"""
from abc import ABC, abstractmethod
from enum import Enum

from agent.tool_calls import ToolCallRequest, ToolSpec


class ExecutionDecision(Enum):
    """ExecutionPolicy.evaluate() 的三種可能結果。"""

    ALLOW = "allow"
    DENY = "deny"
    CONFIRMATION_REQUIRED = "confirmation_required"


class ExecutionPolicy(ABC):
    """所有工具執行政策都必須實作此介面。"""

    @abstractmethod
    def evaluate(
        self,
        tool_call: ToolCallRequest,
        tool_spec: ToolSpec | None,
        context: dict,
    ) -> ExecutionDecision:
        """決定是否允許執行這次工具呼叫。

        - tool_spec 可能為 None（例如模型要求了一個未註冊的工具）。
        - context 保留給未來擴充（例如 session 資訊、使用者角色、風險等級），
          v0.2 不對其內容做任何假設。
        """
        raise NotImplementedError


class AllowAllExecutionPolicy(ExecutionPolicy):
    """v0.2 預設政策：全部放行，行為等同沒有 policy 邊界前的「一律執行」。"""

    def evaluate(
        self,
        tool_call: ToolCallRequest,
        tool_spec: ToolSpec | None,
        context: dict,
    ) -> ExecutionDecision:
        return ExecutionDecision.ALLOW
