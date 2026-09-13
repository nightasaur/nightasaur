# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""FallbackToolCallAdapter —— prompt-based tool-calling fallback。

給沒有原生 function-calling 能力的模型（例如目前的 Ollama qwen2.5:3b）使用：
把 tool 規格轉成一段 system prompt 附加指示，要求模型「需要工具時」用一個
嚴格、明確的 JSON marker 格式回覆；再從模型的純文字輸出中解析出這個 marker。

這個 adapter 完全不知道 Ollama、OpenAI 或任何特定 provider 的存在 —— 它只處理
「純文字 in / ModelResponse out」，可以被任何缺乏原生 tool-calling 能力的
ModelProvider 重複使用（未來若有其他純文字模型後端，也不需要重寫這段邏輯）。

Fail-safe 原則：只有在輸出「精確符合」預期的 marker 格式時，才會被解析成
tool call；任何格式不符、JSON 解析失敗、或缺少必要欄位的情況，一律視為
普通文字內容（ModelResponse(content=...)），絕對不拋出例外、不產生殘缺或
猜測性的 tool call。
"""
import json
import re
import uuid

from agent.tool_calls import ModelResponse, ToolCallRequest, ToolSpec

# 要求模型在需要呼叫工具時，用這個精確的 fenced code block 格式回覆。
# 選用一個不太可能與一般模型輸出衝突的 marker 語言標籤。
_MARKER_LANGUAGE = "tool_call"
_MARKER_PATTERN = re.compile(
    r"```tool_call\s*\n(?P<payload>.*?)\n?```",
    re.DOTALL,
)


class FallbackToolCallAdapter:
    """把 provider-neutral 的 ToolSpec 轉成 prompt 指示，並把模型純文字輸出
    解析回 provider-neutral 的 ModelResponse。
    """

    def build_messages(
        self, messages: list[dict], tools: list[ToolSpec]
    ) -> list[dict]:
        """在原始 messages 前面插入一段工具使用說明的 system message。
        不修改呼叫端傳入的 messages 列表本身（回傳新的 list）。
        """
        if not tools:
            return messages

        tool_lines = []
        for spec in tools:
            tool_lines.append(
                f"- {spec.name}: {spec.description} "
                f"(parameters schema: {json.dumps(spec.parameters, ensure_ascii=False)})"
            )

        instruction = (
            "你可以使用以下工具：\n"
            + "\n".join(tool_lines)
            + "\n\n"
            "如果需要使用工具，你的回覆「只能」包含以下格式的一個 code block，"
            "不要有其他文字：\n"
            "```tool_call\n"
            '{"name": "工具名稱", "arguments": {...}}\n'
            "```\n"
            "如果不需要使用工具，就直接用一般文字回答，不要輸出上述格式。"
        )

        return [{"role": "system", "content": instruction}] + list(messages)

    def parse(self, raw_text: str) -> ModelResponse:
        """解析模型的純文字輸出。只有精確符合 marker 格式且 JSON 有效、
        並包含必要欄位時才會被視為 tool call；其餘一律視為普通內容。
        """
        if raw_text is None:
            return ModelResponse(content=raw_text)

        match = _MARKER_PATTERN.search(raw_text)
        if not match:
            return ModelResponse(content=raw_text)

        payload_text = match.group("payload").strip()
        try:
            payload = json.loads(payload_text)
        except (json.JSONDecodeError, TypeError):
            # 格式不符預期 —— fail-safe 視為普通文字，不拋出例外。
            return ModelResponse(content=raw_text)

        if not isinstance(payload, dict) or "name" not in payload:
            return ModelResponse(content=raw_text)

        name = payload.get("name")
        if not isinstance(name, str) or not name:
            return ModelResponse(content=raw_text)

        arguments = payload.get("arguments", {})
        if not isinstance(arguments, dict):
            # arguments 型別不符 —— 同樣 fail-safe，不猜測、不硬轉型別。
            return ModelResponse(content=raw_text)

        tool_call = ToolCallRequest(
            id=str(uuid.uuid4()), name=name, arguments=arguments
        )
        return ModelResponse(content=None, tool_calls=[tool_call])
