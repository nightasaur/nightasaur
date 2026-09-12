# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""AgentCore v0.2 tool-calling execution loop 測試。

涵蓋 test matrix：no-tool path、single tool call、tool result -> final
answer、message ordering、unknown tool、tool exception、max-iteration stop
（含 per-run override）、ExecutionPolicy boundary（deny/confirmation_required
一律不執行工具）、以及 ModelProvider 收到的 tool_specs 契約。另涵蓋
tool_trace 安全邊界：raw object 不外洩、敏感字串遮蔽、長度截斷、
永遠 JSON-safe。
"""
import json

import pytest

from agent.core import AgentCore
from agent.execution_policy import ExecutionDecision, ExecutionPolicy
from agent.memory.in_memory import EphemeralMemoryProvider
from agent.schemas import AgentInput
from agent.tool_calls import ModelResponse, ToolCallRequest
from agent.tools.base import Tool
from agent.tools.registry import ToolRegistry
from tests.conftest import FakeModelProvider


class GreetTool(Tool):
    name = "greet"
    description = "Greets a person by name."
    parameters = {
        "type": "object",
        "properties": {"name": {"type": "string"}},
        "required": ["name"],
    }

    async def run(self, **kwargs):
        return f"Hello, {kwargs['name']}!"


class ExplodingTool(Tool):
    name = "exploding"
    description = "Always raises for testing safe-observation error handling."

    async def run(self, **kwargs):
        raise RuntimeError("kaboom")


class DenyAllExecutionPolicy(ExecutionPolicy):
    def evaluate(self, tool_call, tool_spec, context):
        return ExecutionDecision.DENY


class ConfirmationExecutionPolicy(ExecutionPolicy):
    def evaluate(self, tool_call, tool_spec, context):
        return ExecutionDecision.CONFIRMATION_REQUIRED


def _core(model_provider, tools=None, **kwargs):
    registry = ToolRegistry()
    for tool in tools or []:
        registry.register(tool)
    return AgentCore(
        model_provider=model_provider,
        tool_registry=registry,
        memory_provider=EphemeralMemoryProvider(),
        **kwargs,
    )


@pytest.mark.asyncio
async def test_no_tool_path_matches_v01_behavior(fake_model_provider):
    """空 ToolRegistry 時，行為應與 v0.1 完全相同：只呼叫一次 generate()。"""
    core = _core(fake_model_provider)

    output = await core.run(AgentInput(message="hi"))

    assert output.content == fake_model_provider.reply
    assert fake_model_provider.call_count == 1
    assert fake_model_provider.received_tools[0] == []
    assert output.metadata["iterations"] == 0


@pytest.mark.asyncio
async def test_single_tool_call_then_final_answer():
    call = ToolCallRequest(id="call-1", name="greet", arguments={"name": "Ada"})
    provider = FakeModelProvider(
        responses=[
            ModelResponse(tool_calls=[call]),
            ModelResponse(content="Done, greeted Ada."),
        ]
    )
    core = _core(provider, tools=[GreetTool()])

    output = await core.run(AgentInput(message="please greet Ada"))

    assert output.content == "Done, greeted Ada."
    assert provider.call_count == 2
    assert output.metadata["iterations"] == 1
    assert output.metadata["tool_trace"][0]["ok"] is True
    # tool_trace 的 result 已經過 build_safe_trace_value() 正規化（頂層純
    # 量值會被包成 {"value": ...}，與 serialize_tool_result() 的既有契約
    # 一致），而不是保留序列化前的原始字串。
    assert output.metadata["tool_trace"][0]["result"] == {"value": "Hello, Ada!"}


@pytest.mark.asyncio
async def test_tool_result_fed_back_to_model_as_serialized_tool_message():
    call = ToolCallRequest(id="call-1", name="greet", arguments={"name": "Ada"})
    provider = FakeModelProvider(
        responses=[ModelResponse(tool_calls=[call]), ModelResponse(content="final")]
    )
    core = _core(provider, tools=[GreetTool()])

    await core.run(AgentInput(message="greet Ada"))

    second_call_messages = provider.received_messages[1]
    tool_messages = [m for m in second_call_messages if m["role"] == "tool"]
    assert len(tool_messages) == 1
    assert tool_messages[0]["tool_call_id"] == "call-1"
    assert tool_messages[0]["name"] == "greet"
    # 送進 messages 的內容必須是經過 serializer 正規化的 JSON-safe dict，
    # 而不是任意 Python 物件。
    assert tool_messages[0]["content"] == {"value": "Hello, Ada!"}


@pytest.mark.asyncio
async def test_message_ordering_system_history_user_toolcall_toolresult_final():
    call = ToolCallRequest(id="call-1", name="greet", arguments={"name": "Ada"})
    provider = FakeModelProvider(
        responses=[
            ModelResponse(tool_calls=[call]),
            ModelResponse(content="final answer"),
        ]
    )
    core = _core(provider, tools=[GreetTool()])
    history = [
        {"role": "user", "content": "previous"},
        {"role": "assistant", "content": "previous reply"},
    ]

    output = await core.run(
        AgentInput(message="greet Ada", system_prompt="sys", history=history)
    )

    roles = [m["role"] for m in output.metadata["messages"]]
    assert roles == [
        "system",
        "user",
        "assistant",
        "user",
        "assistant",
        "tool",
        "assistant",
    ]


@pytest.mark.asyncio
async def test_unknown_tool_becomes_observation_not_crash():
    """模型要求了一個未註冊的工具，應該變成一則 observation，loop 繼續，
    而不是讓整個 run() 拋出例外。
    """
    call = ToolCallRequest(id="call-1", name="does-not-exist", arguments={})
    provider = FakeModelProvider(
        responses=[
            ModelResponse(tool_calls=[call]),
            ModelResponse(content="handled gracefully"),
        ]
    )
    core = _core(provider, tools=[])

    output = await core.run(AgentInput(message="use a missing tool"))

    assert output.content == "handled gracefully"
    trace = output.metadata["tool_trace"][0]
    assert trace["ok"] is False
    assert "not registered" in trace["error"]


@pytest.mark.asyncio
async def test_tool_exception_becomes_observation_not_crash():
    call = ToolCallRequest(id="call-1", name="exploding", arguments={})
    provider = FakeModelProvider(
        responses=[
            ModelResponse(tool_calls=[call]),
            ModelResponse(content="recovered"),
        ]
    )
    core = _core(provider, tools=[ExplodingTool()])

    output = await core.run(AgentInput(message="explode please"))

    assert output.content == "recovered"
    trace = output.metadata["tool_trace"][0]
    assert trace["ok"] is False
    assert "kaboom" in trace["error"]


@pytest.mark.asyncio
async def test_max_tool_iterations_stops_loop_deterministically():
    """模型持續要求同一個工具，永遠不會自然結束 —— 驗證
    max_tool_iterations 硬上限會強制停止並回傳 deterministic fallback。
    """
    call = ToolCallRequest(id="call-x", name="greet", arguments={"name": "Ada"})
    provider = FakeModelProvider(responses=[ModelResponse(tool_calls=[call])])
    core = _core(provider, tools=[GreetTool()], max_tool_iterations=2)

    output = await core.run(AgentInput(message="loop forever"))

    assert provider.call_count == 3
    assert output.metadata["iterations"] == 2
    assert "最大工具呼叫次數" in output.content
    assert output.metadata["tool_trace"][-1]["event"] == "max_iterations_reached"


@pytest.mark.asyncio
async def test_max_tool_iterations_can_be_overridden_per_run():
    call = ToolCallRequest(id="call-x", name="greet", arguments={"name": "Ada"})
    provider = FakeModelProvider(responses=[ModelResponse(tool_calls=[call])])
    core = _core(provider, tools=[GreetTool()], max_tool_iterations=5)

    output = await core.run(
        AgentInput(message="loop forever", max_tool_iterations=1)
    )

    assert provider.call_count == 2
    assert output.metadata["iterations"] == 1


@pytest.mark.asyncio
async def test_execution_policy_deny_prevents_tool_execution():
    call = ToolCallRequest(id="call-1", name="greet", arguments={"name": "Ada"})
    provider = FakeModelProvider(
        responses=[ModelResponse(tool_calls=[call]), ModelResponse(content="final")]
    )
    executed = []

    class TrackingGreetTool(GreetTool):
        async def run(self, **kwargs):
            executed.append(kwargs)
            return await super().run(**kwargs)

    core = _core(
        provider,
        tools=[TrackingGreetTool()],
        execution_policy=DenyAllExecutionPolicy(),
    )

    output = await core.run(AgentInput(message="greet Ada"))

    assert executed == []  # 工具從未真正被呼叫
    trace = output.metadata["tool_trace"][0]
    assert trace["ok"] is False
    assert "not permitted" in trace["error"]
    assert "deny" in trace["error"]


@pytest.mark.asyncio
async def test_execution_policy_confirmation_required_prevents_tool_execution():
    call = ToolCallRequest(id="call-1", name="greet", arguments={"name": "Ada"})
    provider = FakeModelProvider(
        responses=[ModelResponse(tool_calls=[call]), ModelResponse(content="final")]
    )
    executed = []

    class TrackingGreetTool(GreetTool):
        async def run(self, **kwargs):
            executed.append(kwargs)
            return await super().run(**kwargs)

    core = _core(
        provider,
        tools=[TrackingGreetTool()],
        execution_policy=ConfirmationExecutionPolicy(),
    )

    output = await core.run(AgentInput(message="greet Ada"))

    assert executed == []
    trace = output.metadata["tool_trace"][0]
    assert trace["ok"] is False
    assert "confirmation_required" in trace["error"]


@pytest.mark.asyncio
async def test_provider_receives_tool_specs_from_registry():
    """AgentCore 應該把 ToolRegistry.list_specs() 的結果傳給
    ModelProvider.generate(tools=...)，即使模型這次沒有要求任何工具。
    """
    provider = FakeModelProvider()
    core = _core(provider, tools=[GreetTool()])

    await core.run(AgentInput(message="hi"))

    tool_specs = provider.received_tools[0]
    assert len(tool_specs) == 1
    assert tool_specs[0].name == "greet"


@pytest.mark.asyncio
async def test_memory_receives_full_turn_sequence_for_session():
    """有 session_id 時，MemoryProvider 應該保存完整的 user -> assistant
    tool_call -> tool result -> final assistant 序列。
    """
    call = ToolCallRequest(id="call-1", name="greet", arguments={"name": "Ada"})
    provider = FakeModelProvider(
        responses=[
            ModelResponse(tool_calls=[call]),
            ModelResponse(content="final answer"),
        ]
    )
    core = _core(provider, tools=[GreetTool()])

    await core.run(AgentInput(message="greet Ada", session_id="session-1"))

    stored = await core.memory.get_context("session-1", [])
    roles = [m["role"] for m in stored]
    assert roles == ["user", "assistant", "tool", "assistant"]


# ---------------------------------------------------------------------------
# Security hardening: AgentOutput.metadata["tool_trace"] 安全邊界。
# tool_trace 是可能被記錄/回傳給呼叫端的診斷資料，不得原封不動保留 raw
# tool result / arbitrary Python object，也不得無限制暴露看起來像機敏資訊
# 的字串（token/password/email）。
# ---------------------------------------------------------------------------


class SensitiveObjectTool(Tool):
    """回傳一個自訂物件（而非 primitive/dict/list），模擬工具回傳
    「不應該被原封不動保留在 trace 裡」的 raw internal 物件。
    """

    name = "sensitive_lookup"
    description = "Returns a custom object carrying sensitive-looking data."

    class _Payload:
        def __init__(self):
            self.password = "super-secret-value-should-not-leak"

        def __repr__(self):
            return f"<Payload password={self.password}>"

    async def run(self, **kwargs):
        return self._Payload()


class SensitiveDictTool(Tool):
    """回傳一個看起來帶有機敏欄位的 dict（token/password/email）。"""

    name = "credential_lookup"
    description = "Returns a dict containing sensitive-looking fields."

    async def run(self, **kwargs):
        return {
            "user": "ada",
            "password": "hunter2-should-not-leak-in-full",
            "api_token": "sk-live-abcdef0123456789",
            "contact_email": "ada@example.com",
        }


@pytest.mark.asyncio
async def test_tool_trace_never_exposes_raw_custom_object_result():
    call = ToolCallRequest(id="call-1", name="sensitive_lookup", arguments={})
    provider = FakeModelProvider(
        responses=[ModelResponse(tool_calls=[call]), ModelResponse(content="done")]
    )
    core = _core(provider, tools=[SensitiveObjectTool()])

    output = await core.run(AgentInput(message="look it up"))

    trace_result = output.metadata["tool_trace"][0]["result"]

    # 絕不能是原始的 _Payload 實例；必須是安全、JSON-safe 的 placeholder。
    assert not isinstance(trace_result, SensitiveObjectTool._Payload)
    assert isinstance(trace_result, dict)
    assert trace_result.get("__unserializable__") is True

    # 整個 trace/metadata 必須可以被 json.dumps()，不會 raise。
    json.dumps(output.metadata["tool_trace"])

    # 敏感原文不應該以任何形式完整出現在 trace 序列化結果裡。
    assert "super-secret-value-should-not-leak" not in json.dumps(
        output.metadata["tool_trace"]
    )


@pytest.mark.asyncio
async def test_tool_trace_redacts_sensitive_fields_in_dict_result():
    call = ToolCallRequest(id="call-1", name="credential_lookup", arguments={})
    provider = FakeModelProvider(
        responses=[ModelResponse(tool_calls=[call]), ModelResponse(content="done")]
    )
    core = _core(provider, tools=[SensitiveDictTool()])

    output = await core.run(AgentInput(message="look up credentials"))

    trace = output.metadata["tool_trace"][0]
    dumped = json.dumps(trace)

    assert "hunter2-should-not-leak-in-full" not in dumped
    assert "sk-live-abcdef0123456789" not in dumped
    assert "ada@example.com" not in dumped
    assert trace["result"]["password"] == "<redacted>"
    assert trace["result"]["api_token"] == "<redacted>"


@pytest.mark.asyncio
async def test_tool_trace_truncates_long_arguments_and_is_always_json_dumpable():
    long_value = "y" * 5000
    call = ToolCallRequest(
        id="call-1", name="greet", arguments={"name": long_value}
    )
    provider = FakeModelProvider(
        responses=[ModelResponse(tool_calls=[call]), ModelResponse(content="done")]
    )
    core = _core(provider, tools=[GreetTool()])

    output = await core.run(AgentInput(message="greet with a huge name"))

    trace = output.metadata["tool_trace"][0]
    argument_text = trace["arguments"]["name"]

    assert len(argument_text) < len(long_value)
    assert "truncated" in argument_text
    # 整份 metadata（含 messages/tool_trace）都必須是 JSON-safe。
    json.dumps(output.metadata)


@pytest.mark.asyncio
async def test_max_iterations_pending_tool_calls_trace_also_redacted_and_bounded():
    long_value = "z" * 5000
    call = ToolCallRequest(
        id="call-x", name="greet", arguments={"name": long_value}
    )
    provider = FakeModelProvider(responses=[ModelResponse(tool_calls=[call])])
    core = _core(provider, tools=[GreetTool()], max_tool_iterations=1)

    output = await core.run(AgentInput(message="loop forever"))

    max_iter_trace = output.metadata["tool_trace"][-1]
    assert max_iter_trace["event"] == "max_iterations_reached"
    pending_args = max_iter_trace["pending_tool_calls"][0]["arguments"]["name"]
    assert len(pending_args) < len(long_value)
    assert "truncated" in pending_args
    json.dumps(output.metadata["tool_trace"])
