# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Nightasaur Agent Runtime 套件。

對外主要入口：
- AgentCore：一次 agent run 的 orchestration 入口
- AgentInput / AgentOutput：run() 的輸入輸出資料結構
- build_default_agent_core()：組裝目前預設的 Ollama-backed AgentCore
"""
from agent.core import AgentCore
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
    ToolRegistry（v0.1 不預掛真實工具）+ EphemeralMemoryProvider。
    """
    return AgentCore(
        model_provider=OllamaModelProvider(base_url=base_url, model=model),
        tool_registry=ToolRegistry(),
        memory_provider=EphemeralMemoryProvider(),
    )
