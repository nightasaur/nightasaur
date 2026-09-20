"""Schema decoding never supplies the answer or authorizes tool execution."""
import json

import httpx
import pytest

from agent import AgentInput, build_read_only_agent_core
from agent.providers.structured_tool_call import StructuredToolCallAdapter
from agent.tool_calls import ToolSpec


def test_call_and_final_answer_are_distinct_explicit_shapes():
    adapter = StructuredToolCallAdapter()
    call = adapter.parse('{"tool_call":{"name":"workspace_inspect","arguments":{"action":"read","path":"challenge.txt"}}}')
    assert call.content is None
    assert call.tool_calls[0].arguments == {"action": "read", "path": "challenge.txt"}
    final = adapter.parse('{"answer":"actual contents"}')
    assert final.content == "actual contents"
    assert final.tool_calls == []


@pytest.mark.parametrize("raw", [
    '{"name":"workspace_inspect","arguments":{}}',
    '{"answer":"text","tool_call":{"name":"workspace_inspect","arguments":{}}}',
    '{"tool_call":{"name":"workspace_inspect","arguments":[]}}',
    '{"tool_call":{"name":"workspace_inspect"}}',
    '{"tool_call":{"name":"","arguments":{}}}',
    '{"tool_call":{"name":"workspace_inspect","arguments":{},"extra":true}}',
    '{"tool_call":{"name":"workspace_inspect","name":"other","arguments":{}}}',
    '{"tool_call":{"name":"workspace_inspect","arguments":{"limit":NaN}}}',
    '[{"tool_call":{"name":"workspace_inspect","arguments":{}}}]',
    'prefix {"tool_call":{"name":"workspace_inspect","arguments":{}}}',
    '{"tool_call":{"name":"workspace_inspect","arguments":{}}',
])
def test_ambiguous_malformed_or_legacy_json_cannot_execute_a_tool(raw):
    response = StructuredToolCallAdapter().parse(raw)
    assert response.tool_calls == []
    assert response.content == raw


def test_answer_decoding_preserves_all_characters_including_added_quotes():
    response = StructuredToolCallAdapter().parse(json.dumps({"answer": '"extra quotes"\n'}))
    assert response.content == '"extra quotes"\n'


def test_schema_constrains_protocol_not_answer_contents():
    schema = StructuredToolCallAdapter().response_schema([ToolSpec("inspect")])
    assert schema["oneOf"][1]["properties"]["answer"] == {"type": "string"}
    assert schema["oneOf"][0]["properties"]["tool_call"]["oneOf"][0]["properties"]["name"] == {"const": "inspect"}


@pytest.mark.asyncio
async def test_structured_http_roundtrip_reads_real_fixture_under_policy(monkeypatch, tmp_path):
    nonce = "synthetic-content-from-file"
    (tmp_path / "challenge.txt").write_text(nonce)
    requests = []
    async def send(client, request, **kwargs):
        payload = json.loads(request.content)
        requests.append(payload)
        assert "format" in payload
        assert "tools" not in payload
        if len(requests) == 1:
            assert nonce not in json.dumps(payload)
            assert payload["format"]["required"] == ["tool_call"]
            text = '{"tool_call":{"name":"workspace_inspect","arguments":{"action":"read","path":"challenge.txt"}}}'
        else:
            assert nonce in payload["messages"][-1]["content"]
            assert payload["format"]["oneOf"][1]["required"] == ["answer"]
            prior_call = json.loads(payload["messages"][-2]["content"])
            assert prior_call["tool_call"]["name"] == "workspace_inspect"
            text = json.dumps({"answer": nonce})
        return httpx.Response(200, json={"message": {"content": text}}, request=request)
    monkeypatch.setattr(httpx.AsyncClient, "send", send)
    core = build_read_only_agent_core("http://127.0.0.1:11434", "fixture-model:unit", str(tmp_path))
    output = await core.run(AgentInput(message="Read challenge.txt. Return only its exact contents.",
                                            model_options={"require_initial_tool": True}))
    assert output.content == nonce
    assert len(requests) == 2
    assert output.metadata["tool_trace"][0]["ok"] is True
    assert (tmp_path / "challenge.txt").read_text() == nonce


@pytest.mark.asyncio
async def test_schema_does_not_bypass_policy_for_forged_tool_call(monkeypatch, tmp_path):
    requests = []
    async def send(client, request, **kwargs):
        requests.append(request)
        text = ('{"tool_call":{"name":"workspace_patch","arguments":{"path":"created.txt"}}}'
                if len(requests) == 1 else '{"answer":"claimed success"}')
        return httpx.Response(200, json={"message": {"content": text}}, request=request)
    monkeypatch.setattr(httpx.AsyncClient, "send", send)
    core = build_read_only_agent_core("http://127.0.0.1:11434", "fixture-model:unit", str(tmp_path))
    output = await core.run(AgentInput(message="synthetic policy check"))
    assert output.metadata["tool_trace"][0]["ok"] is False
    assert list(tmp_path.iterdir()) == []
