# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""AgentCore —— 統一的 agent run 執行入口。

負責一次 agent run 的 orchestration：組裝 messages（system prompt + 記憶中的
history + 當次 user message）-> 呼叫 ModelProvider 產生回覆 -> 寫回
MemoryProvider。ToolRegistry 一併注入，供呼叫端／未來的 tool-calling 流程使用，
但 v0.1 不做自動多輪 tool-calling loop（模型本身函式呼叫能力有限，先把邊界
與抽象做正確，避免過度設計）。
"""
from agent.memory.base import MemoryProvider
from agent.providers.base import ModelProvider
from agent.schemas import AgentInput, AgentOutput
from agent.tools.registry import ToolRegistry


class AgentCore:
    """一次 agent run 的 orchestration 入口。"""

    def __init__(
        self,
        model_provider: ModelProvider,
        tool_registry: ToolRegistry,
        memory_provider: MemoryProvider,
    ):
        self.model_provider = model_provider
        self.tools = tool_registry
        self.memory = memory_provider

    async def run(self, agent_input: AgentInput) -> AgentOutput:
        """執行一次完整的 agent run，回傳模型產生的內容。"""
        history = await self.memory.get_context(
            agent_input.session_id, agent_input.history
        )

        messages: list[dict] = []
        if agent_input.system_prompt:
            messages.append({"role": "system", "content": agent_input.system_prompt})
        messages.extend(history)
        messages.append({"role": "user", "content": agent_input.message})

        content = await self.model_provider.generate(
            messages, **agent_input.model_options
        )

        await self.memory.append(agent_input.session_id, "user", agent_input.message)
        await self.memory.append(agent_input.session_id, "assistant", content)

        return AgentOutput(content=content, metadata={"messages": messages})
