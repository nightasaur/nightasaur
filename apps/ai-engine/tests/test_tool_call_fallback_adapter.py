# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""FallbackToolCallAdapter 契約測試 —— agent.providers.tool_call_fallback。

這個 adapter 完全獨立於任何特定 ModelProvider，只處理「純文字 in /
ModelResponse out」，測試不需要（也不應該）依賴 OllamaModelProvider 或任何
HTTP mock。
"""
from agent.providers.tool_call_fallback import FallbackToolCallAdapter
from agent.tool_calls import ToolSpec


def test_build_messages_without_tools_returns_original_messages_unchanged():
    adapter = FallbackToolCallAdapter()
    messages = [{"role": "user", "content": "hi"}]

    result = adapter.build_messages(messages, tools=[])

    assert result == messages
    assert result is messages  # 沒有 tools 時完全不處理，直接原樣回傳


def test_build_messages_with_tools_prepends_instruction_system_message():
    adapter = FallbackToolCallAdapter()
    messages = [{"role": "user", "content": "現在幾點？"}]
    tools = [ToolSpec(name="clock", description="回傳目前時間", parameters={})]

    result = adapter.build_messages(messages, tools)

    assert len(result) == len(messages) + 1
    assert result[0]["role"] == "system"
    assert "clock" in result[0]["content"]
    assert "回傳目前時間" in result[0]["content"]
    assert result[1:] == messages
    # 不應該修改呼叫端傳入的原始 messages 物件。
    assert result is not messages


def test_parse_valid_marker_returns_tool_call_request():
    adapter = FallbackToolCallAdapter()
    raw = '```tool_call\n{"name": "clock", "arguments": {"tz": "UTC"}}\n```'

    response = adapter.parse(raw)

    assert response.content is None
    assert len(response.tool_calls) == 1
    assert response.tool_calls[0].name == "clock"
    assert response.tool_calls[0].arguments == {"tz": "UTC"}
    assert response.tool_calls[0].id  # 應該有一個非空的 id


def test_parse_plain_text_without_marker_returns_content_only():
    adapter = FallbackToolCallAdapter()
    raw = "現在是下午三點。"

    response = adapter.parse(raw)

    assert response.content == raw
    assert response.tool_calls == []


def test_parse_marker_missing_name_field_falls_back_to_plain_content():
    adapter = FallbackToolCallAdapter()
    raw = '```tool_call\n{"arguments": {}}\n```'

    response = adapter.parse(raw)

    assert response.content == raw
    assert response.tool_calls == []


def test_parse_marker_with_invalid_json_falls_back_to_plain_content():
    adapter = FallbackToolCallAdapter()
    raw = "```tool_call\nnot valid json\n```"

    response = adapter.parse(raw)

    assert response.content == raw
    assert response.tool_calls == []


def test_parse_marker_with_non_dict_arguments_falls_back_to_plain_content():
    adapter = FallbackToolCallAdapter()
    raw = '```tool_call\n{"name": "clock", "arguments": "not-a-dict"}\n```'

    response = adapter.parse(raw)

    assert response.content == raw
    assert response.tool_calls == []


def test_parse_marker_with_empty_name_falls_back_to_plain_content():
    adapter = FallbackToolCallAdapter()
    raw = '```tool_call\n{"name": "", "arguments": {}}\n```'

    response = adapter.parse(raw)

    assert response.content == raw
    assert response.tool_calls == []


def test_parse_marker_without_arguments_defaults_to_empty_dict():
    adapter = FallbackToolCallAdapter()
    raw = '```tool_call\n{"name": "clock"}\n```'

    response = adapter.parse(raw)

    assert response.tool_calls[0].arguments == {}


def test_parse_never_raises_on_none_input():
    adapter = FallbackToolCallAdapter()

    response = adapter.parse(None)

    assert response.content is None
    assert response.tool_calls == []
