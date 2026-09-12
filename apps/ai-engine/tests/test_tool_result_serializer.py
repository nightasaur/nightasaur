# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""tool 結果序列化邊界測試 —— agent.tool_result_serializer。

驗證 serialize_tool_result() 的 deterministic、JSON-safe 契約：primitive /
dict / list / None 原樣通過，不支援的物件安全 fallback 為 placeholder，且
整個函式絕對不會拋出例外。
"""
import json

from agent.tool_result_serializer import serialize_tool_result


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
