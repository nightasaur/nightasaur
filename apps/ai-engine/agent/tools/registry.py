# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""ToolRegistry —— 工具的註冊、列舉、查找、執行，並提供清楚的錯誤處理。

v0.1 不預先掛載任何真實工具（ComfyUI/生圖不在本次範圍內），僅提供機制本身；
demo/contract 驗證見 agent/tools/echo_tool.py 與對應 pytest。

v0.2 新增 list_specs()，把已註冊工具轉成 provider-neutral 的 ToolSpec 列表，
供 AgentCore 傳給 ModelProvider.generate(tools=...)。
"""
from agent.tool_calls import ToolSpec
from agent.tools.base import (
    Tool,
    ToolExecutionError,
    ToolAlreadyRegisteredError,
    ToolNotFoundError,
)


class ToolRegistry:
    """管理一組 Tool 實例的註冊表。"""

    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        """註冊一個工具。同名工具重複註冊會拋出 ToolAlreadyRegisteredError。"""
        if tool.name in self._tools:
            raise ToolAlreadyRegisteredError(tool.name)
        self._tools[tool.name] = tool

    def list_tools(self) -> list[str]:
        """列舉所有已註冊工具的名稱。"""
        return list(self._tools.keys())

    def list_specs(self) -> list[ToolSpec]:
        """把所有已註冊工具轉成 provider-neutral 的 ToolSpec 列表。
        registry 為空時回傳空列表 —— AgentCore 據此判斷本次 run 是否需要
        任何 tool-calling 行為（空列表代表與 v0.1 完全相同的純文字流程）。
        """
        return [
            ToolSpec(
                name=tool.name,
                description=tool.description,
                parameters=dict(tool.parameters),
            )
            for tool in self._tools.values()
        ]

    def get(self, name: str) -> Tool:
        """依名稱查找工具。找不到時拋出 ToolNotFoundError。"""
        try:
            return self._tools[name]
        except KeyError:
            raise ToolNotFoundError(name) from None

    async def execute(self, tool_name: str, **kwargs):
        """依名稱執行工具。

        - 工具不存在 -> ToolNotFoundError
        - 工具執行時拋出任何例外 -> 包裝為 ToolExecutionError（保留原始例外）

        參數刻意命名為 `tool_name`（而非 `name`），避免與工具自身參數剛好
        叫做 "name" 時（例如 `execute("greet", name="Ada")`）發生
        `**kwargs` 與位置參數搶佔同一個名稱的衝突 —— 呼叫端只要用位置引數
        傳入工具名稱（如既有呼叫方式 `execute("echo", text=...)`），這個
        改動對既有呼叫完全透明。
        """
        tool = self.get(tool_name)
        try:
            return await tool.run(**kwargs)
        except Exception as exc:  # noqa: BLE001 - 統一轉換為 ToolExecutionError
            raise ToolExecutionError(tool_name, exc) from exc
