# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""AgentCore —— 統一的 agent run 執行入口。

v0.1：組裝 messages（system prompt + 記憶中的 history + 當次 user message）->
呼叫 ModelProvider 產生回覆 -> 寫回 MemoryProvider，不做多輪 tool-calling。

v0.2：新增明確的 tool-calling execution loop。AgentCore 只認得
agent.tool_calls 定義的 provider-neutral 形狀（ModelResponse/ToolCallRequest/
ToolCallResult），完全不知道底層模型是用原生 function-calling 還是
prompt-based fallback 產生這些 tool call —— 這個邊界完全由各個
ModelProvider 實作自行負責。

Loop 的安全邊界：
- `max_tool_iterations` 為硬上限，避免模型持續要求工具造成無限循環；達到
  上限時回傳一個 deterministic 的 fallback 內容，而不是繼續執行或拋出例外。
- 每一次工具呼叫在真正執行前，都必須先經過 `ExecutionPolicy.evaluate()`；
  只有 ALLOW 才會呼叫 `ToolRegistry.execute()`，DENY / CONFIRMATION_REQUIRED
  一律轉換成一個 deterministic 的「未執行」觀察結果，工具本身不會被呼叫。
- 工具執行的例外（ToolNotFoundError、ToolExecutionError）一律被捕捉並轉換
  成 ToolCallResult(ok=False, ...)，送回模型當作一則 observation，不會讓
  整個 run() 拋出例外中斷。
- 送回模型前，任何工具結果都必須先經過
  `agent.tool_result_serializer.serialize_tool_result()`，確保只有
  deterministic、JSON-safe 的內容進入 messages。
- `AgentOutput.metadata["tool_trace"]` 是另一個獨立的安全邊界：它是給
  開發者/呼叫端診斷用的資料，可能被記錄或回傳，因此同樣不得保留序列化前
  的原始 Python 物件，字串欄位也不得無限制暴露完整內容（可能包含
  token/password/email 等敏感文字）。tool_trace 一律先經過
  `agent.tool_result_serializer.build_safe_trace_value()` /
  `redact_and_truncate_text()`，取得有長度上限、敏感欄位遮蔽過的
  representation，而不是原始值。
"""
from agent.execution_policy import AllowAllExecutionPolicy, ExecutionDecision, ExecutionPolicy
from agent.memory.base import MemoryProvider
from agent.providers.base import ModelProvider
from agent.schemas import AgentInput, AgentOutput
from agent.tool_calls import ToolCallResult
from agent.tool_result_serializer import (
    build_safe_trace_value,
    redact_and_truncate_text,
    serialize_tool_result,
)
from agent.tools.base import ToolError
from agent.tools.registry import ToolRegistry

#: v0.2 預設的 tool-calling 迭代上限；可在 AgentCore 建構時或個別
#: AgentInput.max_tool_iterations 覆寫。
DEFAULT_MAX_TOOL_ITERATIONS = 4

_MAX_ITERATIONS_FALLBACK_MESSAGE = (
    "已達到本次對話允許的最大工具呼叫次數，先回傳目前已知的資訊。"
)


class AgentCore:
    """一次 agent run 的 orchestration 入口。"""

    def __init__(
        self,
        model_provider: ModelProvider,
        tool_registry: ToolRegistry,
        memory_provider: MemoryProvider,
        execution_policy: ExecutionPolicy | None = None,
        max_tool_iterations: int = DEFAULT_MAX_TOOL_ITERATIONS,
    ):
        self.model_provider = model_provider
        self.tools = tool_registry
        self.memory = memory_provider
        self.execution_policy = execution_policy or AllowAllExecutionPolicy()
        self.max_tool_iterations = max_tool_iterations

    async def run(self, agent_input: AgentInput) -> AgentOutput:
        """執行一次完整的 agent run，回傳模型產生的最終內容。

        registry 沒有任何已註冊工具時（v0.1 的預設情況），tool_specs 為
        空列表，ModelProvider 不會被要求做任何 tool-calling 相關行為，
        整個流程等同 v0.1：呼叫一次 generate() 就結束。
        """
        history = await self.memory.get_context(
            agent_input.session_id, agent_input.history
        )

        messages: list[dict] = []
        if agent_input.system_prompt:
            messages.append({"role": "system", "content": agent_input.system_prompt})
        messages.extend(history)

        user_message = {"role": "user", "content": agent_input.message}
        messages.append(user_message)
        new_turn_messages: list[dict] = [user_message]

        tool_specs = self.tools.list_specs()
        specs_by_name = {spec.name: spec for spec in tool_specs}
        max_iterations = (
            agent_input.max_tool_iterations
            if agent_input.max_tool_iterations is not None
            else self.max_tool_iterations
        )
        policy = agent_input.execution_policy or self.execution_policy

        iterations = 0
        tool_trace: list[dict] = []
        final_content: str | None = None

        while True:
            # 傳出一份 shallow copy，而不是 messages 本身的參考 —— messages
            # 之後還會在同一個 loop 裡繼續被追加內容，若 ModelProvider（或
            # 測試用的 fixture）保留了傳入 list 的參考，之後的變動不應該
            # 回溯影響到「這一次呼叫當下」看到的 messages 快照。
            response = await self.model_provider.generate(
                list(messages), tools=tool_specs, **agent_input.model_options
            )

            if not response.tool_calls:
                final_content = response.content
                assistant_message = {"role": "assistant", "content": final_content}
                messages.append(assistant_message)
                new_turn_messages.append(assistant_message)
                break

            if iterations >= max_iterations:
                final_content = _MAX_ITERATIONS_FALLBACK_MESSAGE
                assistant_message = {"role": "assistant", "content": final_content}
                messages.append(assistant_message)
                new_turn_messages.append(assistant_message)
                tool_trace.append(
                    {
                        "event": "max_iterations_reached",
                        "iterations": iterations,
                        "pending_tool_calls": [
                            {
                                "id": c.id,
                                "name": c.name,
                                "arguments": build_safe_trace_value(c.arguments),
                            }
                            for c in response.tool_calls
                        ],
                    }
                )
                break

            assistant_tool_call_message = {
                "role": "assistant",
                "content": response.content,
                "tool_calls": [
                    {"id": call.id, "name": call.name, "arguments": call.arguments}
                    for call in response.tool_calls
                ],
            }
            messages.append(assistant_tool_call_message)
            new_turn_messages.append(assistant_tool_call_message)

            for call in response.tool_calls:
                spec = specs_by_name.get(call.name)
                decision = self._safe_evaluate_policy(policy, call, spec, agent_input)

                if decision != ExecutionDecision.ALLOW:
                    result = ToolCallResult(
                        id=call.id,
                        name=call.name,
                        ok=False,
                        error=(
                            f"Tool '{call.name}' execution was not permitted "
                            f"({decision.value})."
                        ),
                    )
                else:
                    try:
                        raw_result = await self.tools.execute(
                            call.name, **call.arguments
                        )
                        result = ToolCallResult(
                            id=call.id, name=call.name, ok=True, result=raw_result
                        )
                    except ToolError as exc:
                        result = ToolCallResult(
                            id=call.id, name=call.name, ok=False, error=str(exc)
                        )

                safe_payload = serialize_tool_result(
                    result.result if result.ok else {"error": result.error}
                )
                tool_message = {
                    "role": "tool",
                    "tool_call_id": call.id,
                    "name": call.name,
                    "content": safe_payload,
                }
                messages.append(tool_message)
                new_turn_messages.append(tool_message)

                tool_trace.append(
                    {
                        "id": call.id,
                        "name": call.name,
                        "arguments": build_safe_trace_value(call.arguments),
                        "ok": result.ok,
                        "result": (
                            build_safe_trace_value(result.result)
                            if result.ok
                            else None
                        ),
                        "error": redact_and_truncate_text(result.error),
                    }
                )

            iterations += 1

        for message in new_turn_messages:
            await self.memory.append(agent_input.session_id, message)

        return AgentOutput(
            content=final_content,
            metadata={
                "messages": messages,
                "tool_trace": tool_trace,
                "iterations": iterations,
            },
        )

    @staticmethod
    def _safe_evaluate_policy(policy, tool_call, spec, agent_input) -> ExecutionDecision:
        """呼叫 ExecutionPolicy.evaluate()，任何非預期例外都 fail-safe 視為
        DENY，而不是讓整個 run() 崩潰 —— policy 邊界本身也必須是可控的。
        """
        try:
            return policy.evaluate(
                tool_call, spec, {"session_id": agent_input.session_id}
            )
        except Exception:  # noqa: BLE001 - policy 邊界必須 fail-safe
            return ExecutionDecision.DENY
