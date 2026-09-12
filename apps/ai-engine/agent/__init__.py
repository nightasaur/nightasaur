# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Nightasaur Agent Runtime 套件。

對外主要入口：
- AgentCore：一次 agent run 的 orchestration 入口
- AgentInput / AgentOutput：run() 的輸入輸出資料結構
- build_default_agent_core()：組裝目前預設的 Ollama-backed AgentCore
"""
from agent.core import DEFAULT_MAX_TOOL_ITERATIONS, AgentCore
from agent.execution_policy import AllowAllExecutionPolicy
from agent.memory.in_memory import EphemeralMemoryProvider
from agent.providers.ollama_provider import OllamaModelProvider
from agent.schemas import AgentInput, AgentOutput
from agent.tools.registry import ToolRegistry

__all__ = [
    "AgentCore",
    "AgentInput",
    "AgentOutput",
    "build_default_agent_core",
]


def build_default_agent_core(base_url: str, model: str) -> AgentCore:
    """組裝目前正式環境使用的 AgentCore：Ollama ModelProvider + 空的
    ToolRegistry（v0.2 仍不預掛真實工具）+ EphemeralMemoryProvider +
    預設全部放行的 AllowAllExecutionPolicy + 預設的 max_tool_iterations。

    ToolRegistry 為空時，AgentCore 的 tool-calling loop 只會執行一次
    generate() 就結束，行為與 v0.1 完全相同。
    """
    return AgentCore(
        model_provider=OllamaModelProvider(base_url=base_url, model=model),
        tool_registry=ToolRegistry(),
        memory_provider=EphemeralMemoryProvider(),
        execution_policy=AllowAllExecutionPolicy(),
        max_tool_iterations=DEFAULT_MAX_TOOL_ITERATIONS,
    )
