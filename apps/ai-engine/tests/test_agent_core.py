# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""AgentCore 基本流程測試。"""
import pytest

from agent.core import AgentCore
from agent.memory.in_memory import EphemeralMemoryProvider
from agent.schemas import AgentInput
from agent.tools.registry import ToolRegistry


@pytest.mark.asyncio
async def test_agent_core_basic_run_returns_model_output(fake_model_provider):
    """AgentCore.run() 應呼叫 ModelProvider 並回傳其產生的內容。"""
    core = AgentCore(
        model_provider=fake_model_provider,
        tool_registry=ToolRegistry(),
        memory_provider=EphemeralMemoryProvider(),
    )

    output = await core.run(AgentInput(message="哈囉"))

    assert output.content == fake_model_provider.reply
    assert len(fake_model_provider.received_messages) == 1


@pytest.mark.asyncio
async def test_agent_core_assembles_system_prompt_history_and_message(fake_model_provider):
    """messages 組裝順序應為 system -> history -> 當次 user message。"""
    core = AgentCore(
        model_provider=fake_model_provider,
        tool_registry=ToolRegistry(),
        memory_provider=EphemeralMemoryProvider(),
    )

    history = [
        {"role": "user", "content": "之前的訊息"},
        {"role": "assistant", "content": "之前的回覆"},
    ]

    await core.run(
        AgentInput(
            message="這次的訊息",
            system_prompt="你是一個測試用助手",
            history=history,
        )
    )

    sent_messages = fake_model_provider.received_messages[0]
    assert sent_messages[0] == {"role": "system", "content": "你是一個測試用助手"}
    assert sent_messages[1:3] == history
    assert sent_messages[-1] == {"role": "user", "content": "這次的訊息"}


@pytest.mark.asyncio
async def test_agent_core_without_system_prompt_omits_system_message(fake_model_provider):
    """未提供 system_prompt 時，不應該產生空的 system message。"""
    core = AgentCore(
        model_provider=fake_model_provider,
        tool_registry=ToolRegistry(),
        memory_provider=EphemeralMemoryProvider(),
    )

    await core.run(AgentInput(message="hi"))

    sent_messages = fake_model_provider.received_messages[0]
    assert all(m["role"] != "system" for m in sent_messages)


@pytest.mark.asyncio
async def test_agent_core_passes_model_options_through(fake_model_provider):
    """AgentInput.model_options 應原樣傳給 ModelProvider.generate()。"""
    core = AgentCore(
        model_provider=fake_model_provider,
        tool_registry=ToolRegistry(),
        memory_provider=EphemeralMemoryProvider(),
    )

    await core.run(
        AgentInput(message="hi", model_options={"temperature": 0.1, "num_predict": 64})
    )

    assert fake_model_provider.received_options[0] == {
        "temperature": 0.1,
        "num_predict": 64,
    }


@pytest.mark.asyncio
async def test_agent_core_exposes_tool_registry(fake_model_provider):
    """AgentCore 應該把注入的 ToolRegistry 原樣暴露在 .tools 上。"""
    registry = ToolRegistry()
    core = AgentCore(
        model_provider=fake_model_provider,
        tool_registry=registry,
        memory_provider=EphemeralMemoryProvider(),
    )

    assert core.tools is registry
