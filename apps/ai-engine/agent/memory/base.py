# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""MemoryProvider 抽象介面。

AgentCore 只透過此介面存取「長期記憶」，第一版是最小的 in-memory 實作
（EphemeralMemoryProvider），未來可無痛替換為 PostgreSQL、向量資料庫等後端，
不需更動 AgentCore 或 routers 層。
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
    async def append(self, session_id: str | None, role: str, content: str) -> None:
        """將一則新訊息寫入記憶。session_id 為 None 時應為 no-op。"""
        raise NotImplementedError
