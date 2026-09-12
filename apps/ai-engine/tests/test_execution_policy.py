# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""ExecutionPolicy 邊界測試 —— agent.execution_policy。"""
import pytest

from agent.execution_policy import (
    AllowAllExecutionPolicy,
    ExecutionDecision,
    ExecutionPolicy,
)
from agent.tool_calls import ToolCallRequest, ToolSpec


def test_execution_policy_is_abstract():
    with pytest.raises(TypeError):
        ExecutionPolicy()  # noqa: 直接實例化抽象類別應該失敗


def test_allow_all_execution_policy_always_allows():
    policy = AllowAllExecutionPolicy()
    call = ToolCallRequest(id="1", name="echo", arguments={"text": "hi"})
    spec = ToolSpec(name="echo", description="", parameters={})

    decision = policy.evaluate(call, spec, context={})

    assert decision == ExecutionDecision.ALLOW


def test_allow_all_execution_policy_allows_even_without_matching_spec():
    """spec 為 None（模型要求了一個未註冊的工具）時，AllowAllExecutionPolicy
    仍然回傳 ALLOW —— 實際「工具不存在」的錯誤處理是 ToolRegistry 的責任，
    不是 ExecutionPolicy 的責任。
    """
    policy = AllowAllExecutionPolicy()
    call = ToolCallRequest(id="1", name="does-not-exist", arguments={})

    decision = policy.evaluate(call, None, context={})

    assert decision == ExecutionDecision.ALLOW


def test_execution_decision_enum_has_three_values():
    assert {d.value for d in ExecutionDecision} == {
        "allow",
        "deny",
        "confirmation_required",
    }
