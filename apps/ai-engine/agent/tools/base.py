# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Tool 介面與 ToolRegistry 專用例外。"""
from abc import ABC, abstractmethod
from typing import Any


class Tool(ABC):
    """所有可被 AgentCore/ToolRegistry 呼叫的工具都必須實作此介面。"""

    #: 工具的唯一名稱，供 ToolRegistry 查找、呼叫使用。
    name: str
    #: 給模型或開發者看的簡短說明。
    description: str = ""

    @abstractmethod
    async def run(self, **kwargs) -> Any:
        """執行工具邏輯並回傳結果。實作內部若失敗應直接拋出例外，
        由 ToolRegistry.execute() 統一轉換為 ToolExecutionError。
        """
        raise NotImplementedError


class ToolError(Exception):
    """所有 ToolRegistry 相關例外的基底類別。"""


class ToolAlreadyRegisteredError(ToolError):
    """嘗試註冊一個已存在同名工具時拋出。"""

    def __init__(self, name: str):
        self.name = name
        super().__init__(f"Tool '{name}' is already registered")


class ToolNotFoundError(ToolError):
    """查找或執行不存在的工具時拋出。"""

    def __init__(self, name: str):
        self.name = name
        super().__init__(f"Tool '{name}' is not registered")


class ToolExecutionError(ToolError):
    """工具執行過程中發生例外時拋出，並保留原始例外供除錯。"""

    def __init__(self, name: str, original_error: Exception):
        self.name = name
        self.original_error = original_error
        super().__init__(f"Tool '{name}' raised an error during execution: {original_error}")
