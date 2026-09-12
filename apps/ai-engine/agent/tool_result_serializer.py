# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Tool 結果序列化邊界。

`ToolCallResult.result` 可以是任意 Python 物件（供 runtime/內部消費），但送回
模型的 messages 前，必須先經過這裡的 `serialize_tool_result()`，確保：

- 結果一定是 JSON-safe（可以被 json.dumps 序列化）
- 結果一定是 dict（非 dict/list 的頂層純量會包成 {"value": ...}）
- 絕對不會拋出例外 —— 任何無法序列化的物件都會被安全地轉成一個
  診斷用的 placeholder，而不是讓整個 agent run 崩潰。

原始（序列化前）的 result 仍保留在 AgentOutput.metadata 的 tool_trace 中，
供開發者除錯，"送給模型的內容" 與 "保留供診斷的內容" 是刻意分開的兩份資料。
"""
import json
from typing import Any

_MAX_REPR_LENGTH = 500

_PRIMITIVE_TYPES = (str, int, float, bool, type(None))


def _normalize(value: Any) -> Any:
    """遞迴正規化任意值，回傳保證 JSON-safe 的結構。此函式內部不吞例外，
    交由呼叫端的 try/except 統一處理，維持單一錯誤處理邊界。
    """
    if isinstance(value, _PRIMITIVE_TYPES):
        return value
    if isinstance(value, dict):
        return {str(k): _normalize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_normalize(item) for item in value]
    # 不認得的型別（自訂物件、dataclass、不支援的容器...）一律用安全的
    # placeholder 表示，不嘗試猜測其結構。
    return {
        "__unserializable__": True,
        "type": type(value).__name__,
        "repr": repr(value)[:_MAX_REPR_LENGTH],
    }


def serialize_tool_result(value: Any) -> dict:
    """把任意 tool 執行結果正規化成 deterministic、JSON-safe 的 dict。

    保證：
    - 一定回傳 dict（頂層非 dict/list 的值會包成 {"value": ...}）
    - 一定可以被 json.dumps() 序列化
    - 絕對不會拋出例外；序列化過程本身出錯時回傳結構化的錯誤 fallback
    """
    try:
        normalized = _normalize(value)
        if not isinstance(normalized, dict):
            normalized = {"value": normalized}
        # 最終防線：確保真的可以被 json.dumps，避免 _normalize 遺漏邊界情況
        # （例如巢狀結構中混入無法序列化的 key）。
        json.dumps(normalized)
        return normalized
    except Exception as exc:  # noqa: BLE001 - 序列化邊界必須無條件不拋出例外
        return {
            "__serialization_error__": True,
            "type": type(value).__name__,
            "error": str(exc)[:_MAX_REPR_LENGTH],
        }
