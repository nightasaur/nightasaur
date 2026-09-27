# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""MemoryProvider 契約 / 最小實作測試。"""
import pytest

from agent.memory.base import MemoryProvider
from agent.memory.in_memory import EphemeralMemoryProvider


def test_memory_provider_is_abstract_and_requires_both_methods():
    """MemoryProvider 是抽象介面，缺少任一必要方法就不能被實例化。"""
    with pytest.raises(TypeError):
        MemoryProvider()  # noqa: 直接實例化抽象類別應該失敗

    class IncompleteProvider(MemoryProvider):
        async def get_context(self, session_id, provided_history):
            return provided_history

        # 故意不實作 append

    with pytest.raises(TypeError):
        IncompleteProvider()


def test_ephemeral_memory_provider_satisfies_interface():
    provider = EphemeralMemoryProvider()
    assert isinstance(provider, MemoryProvider)


@pytest.mark.asyncio
async def test_ephemeral_memory_provider_passthrough_when_session_id_none():
    """session_id=None 時應完全 pass-through，維持現有呼叫端行為不變。"""
    provider = EphemeralMemoryProvider()
    history = [{"role": "user", "content": "hi"}]

    context = await provider.get_context(None, history)
    assert context == history

    # append 對 session_id=None 應該是 no-op，不應拋出例外也不應留下狀態。
    await provider.append(None, {"role": "user", "content": "hello"})
    assert provider._sessions == {}


@pytest.mark.asyncio
async def test_ephemeral_memory_provider_accumulates_history_per_session():
    """有 session_id 時應該把訊息累積起來，供同一 session 之後的 run 使用。"""
    provider = EphemeralMemoryProvider()

    await provider.append("session-1", {"role": "user", "content": "第一句"})
    await provider.append("session-1", {"role": "assistant", "content": "回覆"})

    context = await provider.get_context("session-1", [])
    assert context == [
        {"role": "user", "content": "第一句"},
        {"role": "assistant", "content": "回覆"},
    ]


@pytest.mark.asyncio
async def test_ephemeral_memory_provider_keeps_sessions_isolated():
    provider = EphemeralMemoryProvider()

    await provider.append("session-a", {"role": "user", "content": "A的訊息"})
    await provider.append("session-b", {"role": "user", "content": "B的訊息"})

    context_a = await provider.get_context("session-a", [])
    context_b = await provider.get_context("session-b", [])

    assert context_a == [{"role": "user", "content": "A的訊息"}]
    assert context_b == [{"role": "user", "content": "B的訊息"}]


@pytest.mark.asyncio
async def test_ephemeral_memory_provider_can_store_tool_call_messages():
    """append() 應能保存完整的 tool-calling 訊息序列（含 tool_call_id/name），
    而不只是簡單的 role/content 配對。
    """
    provider = EphemeralMemoryProvider()

    await provider.append("session-tools", {"role": "user", "content": "幾點了？"})
    await provider.append(
        "session-tools",
        {
            "role": "assistant",
            "content": None,
            "tool_calls": [{"id": "call-1", "name": "clock", "arguments": {}}],
        },
    )
    await provider.append(
        "session-tools",
        {"role": "tool", "tool_call_id": "call-1", "name": "clock", "content": {"time": "10:00"}},
    )
    await provider.append("session-tools", {"role": "assistant", "content": "現在 10:00"})

    context = await provider.get_context("session-tools", [])
    assert [m["role"] for m in context] == ["user", "assistant", "tool", "assistant"]
    assert context[2]["tool_call_id"] == "call-1"
