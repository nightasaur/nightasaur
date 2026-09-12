# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""ToolRegistry 測試，包含用 EchoTool 驗證完整契約：
Tool interface -> ToolRegistry.register/get/execute -> 結果/錯誤。
"""
import pytest

from agent.tools.base import (
    Tool,
    ToolAlreadyRegisteredError,
    ToolExecutionError,
    ToolNotFoundError,
)
from agent.tools.echo_tool import EchoTool
from agent.tools.registry import ToolRegistry


class BrokenTool(Tool):
    """永遠拋出例外的工具，用來驗證 ToolExecutionError 包裝行為。"""

    name = "broken"
    description = "Always raises for testing ToolExecutionError wrapping."

    async def run(self, **kwargs):
        raise RuntimeError("boom")


def test_register_and_list_tools():
    registry = ToolRegistry()
    registry.register(EchoTool())

    assert registry.list_tools() == ["echo"]


def test_register_duplicate_name_raises():
    registry = ToolRegistry()
    registry.register(EchoTool())

    with pytest.raises(ToolAlreadyRegisteredError):
        registry.register(EchoTool())


def test_get_registered_tool_by_name():
    registry = ToolRegistry()
    tool = EchoTool()
    registry.register(tool)

    assert registry.get("echo") is tool


def test_get_unknown_tool_raises_not_found():
    registry = ToolRegistry()

    with pytest.raises(ToolNotFoundError):
        registry.get("does-not-exist")


@pytest.mark.asyncio
async def test_execute_unknown_tool_raises_not_found():
    registry = ToolRegistry()

    with pytest.raises(ToolNotFoundError):
        await registry.execute("does-not-exist", text="hi")


@pytest.mark.asyncio
async def test_echo_tool_full_contract_register_get_execute_success():
    """完整走一次 Tool interface -> register -> get -> execute 的成功路徑。"""
    registry = ToolRegistry()
    registry.register(EchoTool())

    assert isinstance(registry.get("echo"), Tool)
    result = await registry.execute("echo", text="hello world")

    assert result == "hello world"


@pytest.mark.asyncio
async def test_echo_tool_missing_argument_wraps_as_tool_execution_error():
    """EchoTool 缺少必要參數時應拋出 ValueError，並被 ToolRegistry 包成
    ToolExecutionError，同時保留原始例外供除錯。
    """
    registry = ToolRegistry()
    registry.register(EchoTool())

    with pytest.raises(ToolExecutionError) as exc_info:
        await registry.execute("echo")

    assert exc_info.value.name == "echo"
    assert isinstance(exc_info.value.original_error, ValueError)


@pytest.mark.asyncio
async def test_broken_tool_execution_error_wraps_original_exception():
    registry = ToolRegistry()
    registry.register(BrokenTool())

    with pytest.raises(ToolExecutionError) as exc_info:
        await registry.execute("broken")

    assert exc_info.value.name == "broken"
    assert isinstance(exc_info.value.original_error, RuntimeError)
    assert str(exc_info.value.original_error) == "boom"
