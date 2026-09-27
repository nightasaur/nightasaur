# SPDX-License-Identifier: MIT
"""Strict JSON protocol for Ollama schema-constrained tool responses.

The schema constrains syntax, never the expected tool result. AgentCore still
checks policy and executes every tool; final answers are supplied by the model.
"""
from __future__ import annotations

import json
import uuid

from agent.tool_calls import ModelResponse, ToolCallRequest, ToolSpec


class StructuredToolCallAdapter:
    def response_schema(self, tools: list[ToolSpec], *, require_call: bool = False) -> dict:
        calls = [{
            "type": "object",
            "properties": {
                "name": {"const": spec.name},
                "arguments": spec.parameters or {"type": "object"},
            },
            "required": ["name", "arguments"],
            "additionalProperties": False,
        } for spec in tools]
        call_schema = {
            "type": "object", "properties": {"tool_call": {"oneOf": calls}},
            "required": ["tool_call"], "additionalProperties": False,
        }
        if require_call:
            return call_schema
        return {"oneOf": [call_schema,
            {"type": "object", "properties": {"answer": {"type": "string"}},
             "required": ["answer"], "additionalProperties": False},
        ]}

    def build_messages(self, messages: list[dict], tools: list[ToolSpec], *, require_call: bool = False) -> list[dict]:
        instruction = (
            "Respond with one JSON object matching the response schema. "
            'To call a tool: {"tool_call":{"name":"tool_name","arguments":{}}}. '
            + ("This request requires a tool call before answering. Call a listed tool now. "
               if require_call else 'To give the final answer: {"answer":"your answer"}. ')
            +
            "Use a tool when the requested information is not yet available. "
            "Never invent file contents or tool results. After a successful read, "
            "answer using the returned data; do not repeat a completed call. "
            "The answer string must follow the user's requested format and language. "
            "For exact file contents, copy the tool result's content into answer "
            "without an introduction, extra quotation marks, or code fences.\n"
            "Available tools:\n"
            + "\n".join(f"- {spec.name}: {spec.description}" for spec in tools)
            + "\nResponse schema:\n" + json.dumps(self.response_schema(tools, require_call=require_call), ensure_ascii=False)
        )
        return [{"role": "system", "content": instruction}, *messages]

    @staticmethod
    def parse(raw_text: str) -> ModelResponse:
        # Reject duplicate keys rather than relying on JSON's last-key wins.
        def unique_object(pairs):
            obj = {}
            for key, value in pairs:
                if key in obj:
                    raise ValueError("duplicate_response_key")
                obj[key] = value
            return obj

        def reject_constant(value):
            raise ValueError("non_json_number")

        try:
            payload = json.loads(raw_text, object_pairs_hook=unique_object,
                                 parse_constant=reject_constant)
        except (ValueError, TypeError):
            return ModelResponse(content=raw_text)
        if not isinstance(payload, dict):
            return ModelResponse(content=raw_text)
        if set(payload) == {"answer"} and isinstance(payload["answer"], str):
            return ModelResponse(content=payload["answer"])
        if set(payload) == {"tool_call"}:
            call = payload["tool_call"]
            if (isinstance(call, dict) and set(call) == {"name", "arguments"}
                    and isinstance(call["name"], str) and call["name"].strip()
                    and isinstance(call["arguments"], dict)):
                return ModelResponse(tool_calls=[ToolCallRequest(
                    id=str(uuid.uuid4()), name=call["name"], arguments=call["arguments"],
                )])
        return ModelResponse(content=raw_text)
