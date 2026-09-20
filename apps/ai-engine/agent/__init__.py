# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Nightasaur Agent Runtime 套件。

對外主要入口：
- AgentCore：一次 agent run 的 orchestration 入口
- AgentInput / AgentOutput：run() 的輸入輸出資料結構
- build_default_agent_core()：組裝目前預設的 Ollama-backed AgentCore

v0.3 新增：
- capability：能力描述系統
- contexts：運行時上下文資料結構
"""
import os

from agent.capability import Capability, CapabilitySet
from agent.contexts import (
    AgentIdentity,
    DeviceContext,
    ProviderContext,
    ProviderDescriptor,
    RuntimeContext,
)
from agent.core import DEFAULT_MAX_TOOL_ITERATIONS, AgentCore
from agent.execution_policy import ReadOnlyExecutionPolicy
from agent.memory.in_memory import EphemeralMemoryProvider
from agent.providers.ollama_provider import OllamaModelProvider
from agent.schemas import AgentInput, AgentOutput
from agent.tools.registry import ToolRegistry
from agent.tools.workspace_inspect import WorkspaceInspectTool

__all__ = [
    "AgentCore",
    "AgentInput",
    "AgentOutput",
    "build_default_agent_core",
    "build_read_only_agent_core",
    # v0.3 exports
    "Capability",
    "CapabilitySet",
    "AgentIdentity",
    "DeviceContext",
    "ProviderContext",
    "ProviderDescriptor",
    "RuntimeContext",
    "ReadOnlyExecutionPolicy",
]


def build_default_agent_core(base_url: str, model: str) -> AgentCore:
    """組裝目前正式環境使用的 AgentCore：Ollama ModelProvider + 空的
    ToolRegistry（v0.2 仍不預掛真實工具）+ EphemeralMemoryProvider +
    v0.4 fail-closed 的 ReadOnlyExecutionPolicy + 預設 max_tool_iterations。

    ToolRegistry 為空時，AgentCore 的 tool-calling loop 只會執行一次
    generate() 就結束，行為與 v0.1 完全相同。
    """
    provider = OllamaModelProvider
    if os.getenv("AI_STRICT_INFERENCE") == "1":
        from agent.providers.production_ollama import ProductionOllamaModelProvider
        provider = ProductionOllamaModelProvider
    return AgentCore(
        model_provider=provider(base_url=base_url, model=model),
        tool_registry=ToolRegistry(),
        memory_provider=EphemeralMemoryProvider(),
        execution_policy=ReadOnlyExecutionPolicy(),
        max_tool_iterations=DEFAULT_MAX_TOOL_ITERATIONS,
    )


def build_read_only_agent_core(
    base_url: str, model: str, workspace_root: str
) -> AgentCore:
    """Build the v0.4 inspect-only runtime for a bounded workspace.

    This is opt-in so existing dialogue/assistant call sites keep their
    empty-registry behavior. Only explicitly read-only tools are registered,
    and the fail-closed policy rejects every other tool specification.
    """
    registry = ToolRegistry()
    registry.register(WorkspaceInspectTool(workspace_root))
    return AgentCore(
        model_provider=OllamaModelProvider(base_url=base_url, model=model, tool_call_mode="json_schema"),
        tool_registry=registry,
        memory_provider=EphemeralMemoryProvider(),
        execution_policy=ReadOnlyExecutionPolicy(),
        max_tool_iterations=DEFAULT_MAX_TOOL_ITERATIONS,
    )
