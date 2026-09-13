# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Tool 結果序列化邊界。

`ToolCallResult.result` 可以是任意 Python 物件（供 runtime/內部消費），但送回
模型的 messages 前，必須先經過這裡的 `serialize_tool_result()`，確保：

- 結果一定是 JSON-safe（可以被 json.dumps 序列化）
- 結果一定是 dict（非 dict/list 的頂層純量會包成 {"value": ...}）
- 絕對不會拋出例外 —— 任何無法序列化的物件都會被安全地轉成一個
  診斷用的 placeholder，而不是讓整個 agent run 崩潰。

`AgentOutput.metadata["tool_trace"]` 是另一個獨立的安全邊界（診斷用途，
可能被回傳給呼叫端／記錄下來）：它*不能*直接保存序列化前的原始
Python 物件，也不能無限制暴露完整字串內容（可能包含 token/password/
email 等敏感文字）。`build_safe_trace_value()` / `redact_and_truncate_text()`
重用 `serialize_tool_result()` 已經驗證過的 JSON-safe 正規化邏輯，並在其
結果之上再疊加一層 deterministic 的長度截斷與敏感欄位遮蔽，產生「可診斷但
不保留完整原始值」的 trace representation。
"""
import json
import re
from typing import Any, Optional

_MAX_REPR_LENGTH = 500

_PRIMITIVE_TYPES = (str, int, float, bool, type(None))

#: tool_trace 中單一字串欄位允許的最大長度；超過會被截斷並附上省略提示，
#: 避免任意長度的敏感/私密文字被完整暴露在 trace 裡。
_MAX_TRACE_STRING_LENGTH = 200

#: dict key 名稱符合這些關鍵字時，視為敏感欄位，整個值改用 "<redacted>"
#: 表示，而不是嘗試部分遮蔽（例如 password、token、secret、api_key）。
_SENSITIVE_KEY_PATTERN = re.compile(
    r"(token|password|passwd|secret|api[_-]?key|credential|auth)", re.IGNORECASE
)

#: 字串內容中看起來像 email 的部分一律遮蔽，即使 dict key 本身沒有觸發
#: _SENSITIVE_KEY_PATTERN（例如 arguments 是純量字串，或巢狀在 list 裡）。
_EMAIL_PATTERN = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")

#: 即使 dict key 本身沒有觸發 _SENSITIVE_KEY_PATTERN，字串「內容」裡看起來
#: 像 `password=xxx`、`token: xxx` 之類的 key=value/key: value 片段也要被
#: 遮蔽 —— 這是為了涵蓋敏感資訊被包在自訂物件 __repr__、錯誤訊息等自由格式
#: 文字裡的情況（例如 `<Payload password=hunter2>`）。
_INLINE_SENSITIVE_PATTERN = re.compile(
    r"(?i)\b(token|password|passwd|secret|api[_-]?key|credential|auth)"
    r"\s*[:=]\s*([^\s,;'\")\]}]+)"
)

_REDACTED_VALUE = "<redacted>"


def _redact_string_content(text: str) -> str:
    """對單一字串內容套用 deterministic 的敏感內容遮蔽（email、以及
    `password=xxx` 這類 key=value/key: value 片段），不做長度處理 ——
    長度上限交給 `_truncate_text()` 統一處理。
    """
    text = _EMAIL_PATTERN.sub(_REDACTED_VALUE, text)
    text = _INLINE_SENSITIVE_PATTERN.sub(
        lambda m: f"{m.group(1)}={_REDACTED_VALUE}", text
    )
    return text


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


def _truncate_text(text: str) -> str:
    """把字串截斷到 `_MAX_TRACE_STRING_LENGTH`，超過時附加 deterministic
    的省略提示（包含被截掉的字元數），而不是靜默丟棄資訊。
    """
    if len(text) <= _MAX_TRACE_STRING_LENGTH:
        return text
    omitted = len(text) - _MAX_TRACE_STRING_LENGTH
    return f"{text[:_MAX_TRACE_STRING_LENGTH]}...<truncated {omitted} chars>"


def redact_and_truncate_text(text: Optional[str]) -> Optional[str]:
    """把單一字串欄位（例如 tool_trace 的 "error"）正規化成安全的
    trace representation：email 一律遮蔽，且長度一律有上限。

    None 原樣通過（代表「沒有這個欄位」，不是空字串）。
    """
    if text is None:
        return None
    if not isinstance(text, str):
        text = str(text)
    return _truncate_text(_redact_string_content(text))


def _redact_and_truncate(value: Any, key_hint: Optional[str] = None) -> Any:
    """遞迴走訪一個「已經保證 JSON-safe」的結構（來自
    `serialize_tool_result()` 的輸出），疊加長度截斷與敏感欄位遮蔽。

    因為輸入已經是 JSON-safe 的 primitive/dict/list，這裡不需要再處理
    自訂物件或不可序列化的型別，維持最小、專注的邏輯。
    """
    if isinstance(value, str):
        if key_hint and _SENSITIVE_KEY_PATTERN.search(key_hint):
            return _REDACTED_VALUE
        return _truncate_text(_redact_string_content(value))
    if isinstance(value, dict):
        return {
            str(k): _redact_and_truncate(v, key_hint=str(k))
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [_redact_and_truncate(item) for item in value]
    # int / float / bool / None 等其餘 JSON-safe 純量原樣通過。
    return value


def build_safe_trace_value(value: Any) -> Any:
    """把任意值（可能是 tool 呼叫的 arguments 或執行結果的原始值）轉成
    「可診斷但不保留完整原始值」的 trace representation，供
    `AgentOutput.metadata["tool_trace"]` 使用。

    先重用 `serialize_tool_result()` 取得保證 JSON-safe 的結構（不支援的
    自訂物件會變成 `__unserializable__` placeholder，不會是原始 Python
    物件），再對這份已經安全的結構疊加 deterministic 的長度截斷與敏感
    欄位遮蔽（例如 key 名稱含有 token/password/secret 的欄位、或字串中
    看起來像 email 的內容）。

    保證：
    - 絕對不會回傳序列化前的原始 Python 物件（自訂類別實例等）
    - 任何字串欄位都有長度上限，不會無限制暴露完整內容
    - 一定可以被 json.dumps() 序列化；絕對不會拋出例外
    """
    safe = serialize_tool_result(value)
    try:
        return _redact_and_truncate(safe)
    except Exception as exc:  # noqa: BLE001 - trace 邊界必須無條件不拋出例外
        return {
            "__trace_error__": True,
            "type": type(value).__name__,
            "error": str(exc)[:_MAX_REPR_LENGTH],
        }
