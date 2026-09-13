# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""tool 結果序列化邊界測試 —— agent.tool_result_serializer。

驗證 serialize_tool_result() 的 deterministic、JSON-safe 契約：primitive /
dict / list / None 原樣通過，不支援的物件安全 fallback 為 placeholder，且
整個函式絕對不會拋出例外。

另外驗證 build_safe_trace_value() / redact_and_truncate_text() 這個
tool_trace 專用的安全邊界：raw/自訂物件絕不原封不動出現、看起來像機敏資訊
的字串（token/password/email）不會無限制暴露完整原文，且輸出永遠
JSON-safe、不拋出例外。
"""
import json

from agent.tool_result_serializer import (
    build_safe_trace_value,
    redact_and_truncate_text,
    serialize_tool_result,
)


def test_serialize_primitive_string_wraps_as_value():
    assert serialize_tool_result("hello") == {"value": "hello"}


def test_serialize_primitive_int_wraps_as_value():
    assert serialize_tool_result(42) == {"value": 42}


def test_serialize_none_wraps_as_value():
    assert serialize_tool_result(None) == {"value": None}


def test_serialize_bool_wraps_as_value():
    assert serialize_tool_result(True) == {"value": True}


def test_serialize_dict_passes_through_normalized():
    value = {"a": 1, "b": "two", "c": None}
    assert serialize_tool_result(value) == value


def test_serialize_nested_dict_and_list_normalized_recursively():
    value = {"items": [1, "two", {"nested": True}], "count": 3}
    result = serialize_tool_result(value)
    assert result == {"items": [1, "two", {"nested": True}], "count": 3}


def test_serialize_top_level_list_wraps_as_value():
    result = serialize_tool_result([1, 2, 3])
    assert result == {"value": [1, 2, 3]}


def test_serialize_tuple_and_set_normalized_as_list():
    result = serialize_tool_result((1, 2))
    assert result == {"value": [1, 2]}


def test_serialize_result_is_always_json_dumpable():
    value = {"nested": [1, {"x": None}, "y"]}
    result = serialize_tool_result(value)
    # 不應該拋出例外
    json.dumps(result)


def test_serialize_unsupported_custom_object_returns_safe_placeholder():
    class Weird:
        def __repr__(self):
            return "<Weird instance>"

    result = serialize_tool_result(Weird())

    assert result["__unserializable__"] is True
    assert result["type"] == "Weird"
    assert "<Weird instance>" in result["repr"]
    json.dumps(result)  # 仍必須是 JSON-safe


def test_serialize_nested_unsupported_object_inside_dict_is_safely_wrapped():
    class Weird:
        pass

    result = serialize_tool_result({"payload": Weird()})

    assert result["payload"]["__unserializable__"] is True
    json.dumps(result)


def test_serialize_never_raises_even_when_repr_is_broken():
    class BrokenRepr:
        def __repr__(self):
            raise RuntimeError("repr exploded")

    # 不應該拋出例外 —— 必須回傳結構化的錯誤 fallback。
    result = serialize_tool_result(BrokenRepr())

    assert result.get("__unserializable__") or result.get("__serialization_error__")
    json.dumps(result)


# ---------------------------------------------------------------------------
# build_safe_trace_value() / redact_and_truncate_text() —— tool_trace 專用的
# 安全邊界（security hardening：raw object 不外洩、敏感字串不無限制暴露）。
# ---------------------------------------------------------------------------


def test_build_safe_trace_value_never_returns_raw_custom_object():
    class SensitivePayload:
        def __init__(self):
            self.internal_state = "should never leak directly"

        def __repr__(self):
            return "<SensitivePayload internal_state=should never leak directly>"

    raw = SensitivePayload()
    result = build_safe_trace_value(raw)

    # 絕不能是原封不動的原始物件參考。
    assert result is not raw
    assert not isinstance(result, SensitivePayload)
    # 必須是可診斷、JSON-safe 的 placeholder 結構。
    assert isinstance(result, dict)
    assert result.get("__unserializable__") is True
    assert result["type"] == "SensitivePayload"
    json.dumps(result)


def test_build_safe_trace_value_never_returns_raw_object_nested_in_dict():
    class Weird:
        pass

    result = build_safe_trace_value({"payload": Weird(), "count": 1})

    assert isinstance(result["payload"], dict)
    assert result["payload"]["__unserializable__"] is True
    assert result["count"] == 1
    json.dumps(result)


def test_build_safe_trace_value_redacts_sensitive_keyed_string_values():
    value = {
        "username": "ada",
        "password": "hunter2-super-secret",
        "api_key": "sk-abcdef0123456789",
        "auth_token": "eyJhbGciOiJIUzI1NiJ9.payload.sig",
    }

    result = build_safe_trace_value(value)

    assert result["username"] == "ada"
    assert result["password"] == "<redacted>"
    assert result["api_key"] == "<redacted>"
    assert result["auth_token"] == "<redacted>"
    # 敏感原文完全不應該出現在整個結果裡（即使被 dumps 成字串也一樣）。
    dumped = json.dumps(result)
    assert "hunter2-super-secret" not in dumped
    assert "sk-abcdef0123456789" not in dumped


def test_build_safe_trace_value_redacts_email_like_content_in_plain_strings():
    value = {"note": "please contact user@example.com for follow up"}

    result = build_safe_trace_value(value)

    assert "user@example.com" not in json.dumps(result)
    assert "<redacted>" in result["note"]


def test_build_safe_trace_value_truncates_long_strings_deterministically():
    long_text = "x" * 5000
    result = build_safe_trace_value({"value": long_text})

    text = result["value"]
    assert len(text) < len(long_text)
    assert text.startswith("x" * 50)
    assert "truncated" in text
    # 截斷長度必須是 deterministic 的（同樣輸入永遠得到同樣輸出）。
    assert build_safe_trace_value({"value": long_text})["value"] == text


def test_build_safe_trace_value_is_always_json_dumpable_and_never_raises():
    class BrokenRepr:
        def __repr__(self):
            raise RuntimeError("boom")

    for candidate in (
        BrokenRepr(),
        {"nested": {"deep": BrokenRepr()}},
        [1, "two", BrokenRepr()],
        "plain string",
        None,
        {"password": "leaked" * 100},
    ):
        result = build_safe_trace_value(candidate)
        json.dumps(result)  # 不應該拋出例外


def test_redact_and_truncate_text_redacts_email_and_truncates():
    text = "contact me at secret.person@example.com " + ("!" * 1000)

    result = redact_and_truncate_text(text)

    assert "secret.person@example.com" not in result
    assert "<redacted>" in result
    assert "truncated" in result


def test_redact_and_truncate_text_passes_none_through():
    assert redact_and_truncate_text(None) is None


def test_redact_and_truncate_text_short_plain_text_unchanged():
    assert redact_and_truncate_text("kaboom") == "kaboom"
