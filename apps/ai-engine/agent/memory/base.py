# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""MemoryProvider 抽象介面。

AgentCore 只透過此介面存取「長期記憶」，第一版是最小的 in-memory 實作
（EphemeralMemoryProvider），未來可無痛替換為 PostgreSQL、向量資料庫等後端，
不需更動 AgentCore 或 routers 層。

v0.2：append() 從 (role, content) 改為接受一個完整的 message dict，讓
tool-calling loop 的完整訊息序列（user -> assistant tool_call -> tool
result -> final assistant）都能被正確保存，而不只是簡單的 (role, content)
配對。session_id=None 的 pass-through 行為（目前 /dialogue、/assistant 的
呼叫方式）維持完全不變。
"""
from abc import ABC, abstractmethod


class MemoryProvider(ABC):
    """所有記憶後端都必須實作此介面。"""

    @abstractmethod
    async def get_context(
        self, session_id: str | None, provided_history: list[dict]
    ) -> list[dict]:
        """回傳這次 agent run 應該使用的歷史訊息列表。

        - session_id 為 None 時，代表呼叫端自行管理歷史（目前 /dialogue、
          /assistant 的行為），實作應原樣回傳 provided_history。
        - session_id 有值時，實作可自行決定如何結合/取代
          provided_history（例如從資料庫載入該 session 的長期記憶）。
        """
        raise NotImplementedError

    @abstractmethod
    async def append(self, session_id: str | None, message: dict) -> None:
        """將一則新訊息寫入記憶。session_id 為 None 時應為 no-op。

        `message` 是完整的訊息 dict，至少包含 "role" 與 "content"，並且可
        能包含 tool-calling 相關欄位（例如 "tool_call_id"、"name"）。
        MemoryProvider 實作不需要理解這些額外欄位的語意，只需要原樣保存。
        """
        raise NotImplementedError
