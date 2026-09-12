# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""EphemeralMemoryProvider —— MemoryProvider 的最小實作。

- session_id=None：完全 pass-through、不持久化任何東西，確保現有
  /dialogue、/assistant 呼叫鏈（每次都自帶完整 history）行為零改變。
- session_id 有值：用 process 內記憶體的 dict 累積歷史，僅供未來擴充/測試
  使用，行程重啟即消失。正式的長期記憶（PostgreSQL / 向量庫）留待後續版本
  以新的 MemoryProvider 實作替換，AgentCore 不需要跟著改動。

v0.2：append() 改為接受完整 message dict，可保存 tool-calling 相關欄位
（tool_call_id、name 等），讓 user -> assistant tool_call -> tool result ->
final assistant 的完整序列都能被正確累積。
"""
from agent.memory.base import MemoryProvider


class EphemeralMemoryProvider(MemoryProvider):
    def __init__(self):
        self._sessions: dict[str, list[dict]] = {}

    async def get_context(
        self, session_id: str | None, provided_history: list[dict]
    ) -> list[dict]:
        if session_id is None:
            return provided_history
        stored = self._sessions.setdefault(session_id, [])
        # 呼叫端提供的 history 視為權威來源；若有值就同步進 session 記憶。
        if provided_history:
            stored.extend(
                msg for msg in provided_history if msg not in stored
            )
        return stored if stored else provided_history

    async def append(self, session_id: str | None, message: dict) -> None:
        if session_id is None:
            return
        stored = self._sessions.setdefault(session_id, [])
        stored.append(dict(message))
