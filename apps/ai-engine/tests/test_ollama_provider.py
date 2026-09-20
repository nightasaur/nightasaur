# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""OllamaModelProvider HTTP contract 測試。

用 `patch_ollama_httpx_client` fixture 假造 httpx.AsyncClient，完全不連線真實
Ollama，驗證 generate()/health_check() 在各種 HTTP 情境下的回傳格式與行為，
且與重構前 services/llm.py、services/assistant_llm.py 的原始邏輯一致。
"""
import httpx
import pytest

from agent.providers.ollama_provider import OllamaModelProvider
from agent.tool_calls import ToolSpec
from tests.conftest import FakeHttpxResponse


@pytest.mark.asyncio
async def test_generate_success_returns_stripped_content(patch_ollama_httpx_client):
    patch_ollama_httpx_client(
        post_result=FakeHttpxResponse(200, {"message": {"content": "  哈囉！  "}})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")

    result = await provider.generate([{"role": "user", "content": "hi"}])

    assert result.content == "哈囉！"


@pytest.mark.asyncio
async def test_generate_sends_expected_request_payload(patch_ollama_httpx_client):
    calls = patch_ollama_httpx_client(
        post_result=FakeHttpxResponse(200, {"message": {"content": "ok"}})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")
    messages = [{"role": "system", "content": "sys"}, {"role": "user", "content": "hi"}]

    await provider.generate(messages, temperature=0.1, top_p=0.5, num_predict=32)

    assert len(calls) == 1
    method, url, payload = calls[0]
    assert method == "post"
    assert url == "http://ollama.local/api/chat"
    assert payload == {
        "model": "fixture-model:unit",
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.1, "top_p": 0.5, "num_predict": 32},
    }


@pytest.mark.asyncio
async def test_generate_non_200_returns_default_fallback_message(patch_ollama_httpx_client):
    patch_ollama_httpx_client(post_result=FakeHttpxResponse(500, text="boom"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")

    result = await provider.generate([{"role": "user", "content": "hi"}])

    assert result.content == "嗚...我暫時無法回應。請稍後再試。"


@pytest.mark.asyncio
async def test_generate_non_200_uses_custom_fallback_message(patch_ollama_httpx_client):
    """驗證 services/assistant_llm.py 透過 model_options 傳入的自訂
    fallback_message 會被實際使用（AgentInput.model_options 契約）。
    """
    patch_ollama_httpx_client(post_result=FakeHttpxResponse(500, text="boom"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")

    result = await provider.generate(
        [{"role": "user", "content": "hi"}],
        fallback_message="抱歉，我暫時無法回應。請稍後再試。",
    )

    assert result.content == "抱歉，我暫時無法回應。請稍後再試。"


@pytest.mark.asyncio
async def test_generate_connect_error_returns_offline_message(patch_ollama_httpx_client):
    patch_ollama_httpx_client(post_exception=httpx.ConnectError("cannot connect"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")

    result = await provider.generate([{"role": "user", "content": "hi"}])

    assert result.content == "嘎嗚～（AI 引擎尚未啟動，請先執行 Ollama）"


@pytest.mark.asyncio
async def test_generate_generic_exception_returns_error_message(patch_ollama_httpx_client):
    patch_ollama_httpx_client(post_exception=RuntimeError("unexpected"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")

    result = await provider.generate([{"role": "user", "content": "hi"}])

    assert result.content == "嘎嗚～（通訊暫時中斷...）"


@pytest.mark.asyncio
async def test_health_check_success_reports_model_available(patch_ollama_httpx_client):
    patch_ollama_httpx_client(
        get_result=FakeHttpxResponse(
            200, {"models": [{"name": "fixture-model:unit"}, {"name": "llama3"}]}
        )
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")

    result = await provider.health_check()

    assert result == {
        "status": "ok",
        "model": "fixture-model:unit",
        "model_available": True,
        "available_models": ["fixture-model:unit", "llama3"],
    }


@pytest.mark.asyncio
async def test_health_check_success_reports_model_not_available(patch_ollama_httpx_client):
    patch_ollama_httpx_client(
        get_result=FakeHttpxResponse(200, {"models": [{"name": "llama3"}]})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")

    result = await provider.health_check()

    assert result["model_available"] is False


@pytest.mark.asyncio
async def test_health_check_non_200_returns_error_status(patch_ollama_httpx_client):
    patch_ollama_httpx_client(get_result=FakeHttpxResponse(503, text="unavailable"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")

    result = await provider.health_check()

    assert result == {"status": "error", "message": "HTTP 503"}


@pytest.mark.asyncio
async def test_health_check_exception_returns_offline_status(patch_ollama_httpx_client):
    patch_ollama_httpx_client(get_exception=RuntimeError("network down"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")

    result = await provider.health_check()

    assert result == {"status": "offline", "message": "network down"}


@pytest.mark.asyncio
async def test_generate_without_tools_never_injects_fallback_prompt(patch_ollama_httpx_client):
    """`tools` 為 None/空列表時，OllamaModelProvider 完全跳過
    FallbackToolCallAdapter，傳給 Ollama 的 messages 與 v0.1 完全相同
    （byte-identical request payload） —— provider-neutral 的空 tool 契約。
    """
    calls = patch_ollama_httpx_client(
        post_result=FakeHttpxResponse(200, {"message": {"content": "一般回覆"}})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")
    messages = [{"role": "user", "content": "hi"}]

    result = await provider.generate(messages, tools=[])

    assert result.content == "一般回覆"
    assert result.tool_calls == []
    _, _, payload = calls[0]
    assert payload["messages"] == messages  # 沒有被 adapter 插入額外 system message


@pytest.mark.asyncio
async def test_generate_with_tools_injects_fallback_instruction_message(
    patch_ollama_httpx_client,
):
    """`tools` 有值時，OllamaModelProvider 委派給 FallbackToolCallAdapter
    組裝 tool 使用說明，本身不包含任何 marker 解析邏輯。
    """
    calls = patch_ollama_httpx_client(
        post_result=FakeHttpxResponse(200, {"message": {"content": "一般回覆，不需要工具"}})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")
    messages = [{"role": "user", "content": "現在幾點？"}]
    tools = [ToolSpec(name="clock", description="回傳目前時間", parameters={})]

    result = await provider.generate(messages, tools=tools)

    assert result.content == "一般回覆，不需要工具"
    _, _, payload = calls[0]
    assert len(payload["messages"]) == len(messages) + 1
    assert payload["messages"][0]["role"] == "system"
    assert "clock" in payload["messages"][0]["content"]


@pytest.mark.asyncio
async def test_generate_with_tools_renders_tool_history_as_text_messages(
    patch_ollama_httpx_client,
):
    """AgentCore tool history must satisfy Ollama's string-content contract.

    Provider-neutral tool calls/results deliberately use a different shape
    from Ollama's native tool-calling API. The prompt fallback therefore sends
    them as plain text instead of leaking incompatible fields into /api/chat.
    """
    calls = patch_ollama_httpx_client(
        post_result=FakeHttpxResponse(200, {"message": {"content": "summary"}})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")
    tools = [ToolSpec(name="workspace_inspect", description="Inspect workspace")]
    messages = [
        {"role": "user", "content": "list the workspace"},
        {
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": "call-1",
                    "name": "workspace_inspect",
                    "arguments": {"action": "list", "path": "."},
                }
            ],
        },
        {
            "role": "tool",
            "tool_call_id": "call-1",
            "name": "workspace_inspect",
            "content": {"path": ".", "entries": [{"name": "apps"}]},
        },
    ]

    result = await provider.generate(messages, tools=tools)

    assert result.content == "summary"
    _, _, payload = calls[0]
    outgoing = payload["messages"]
    assert all(isinstance(message["content"], str) for message in outgoing)
    assert all(set(message) == {"role", "content"} for message in outgoing)
    assert "workspace_inspect" in outgoing[-2]["content"]
    assert outgoing[-1]["role"] == "user"
    assert '"entries"' in outgoing[-1]["content"]


@pytest.mark.asyncio
async def test_generate_with_tools_parses_valid_tool_call_marker(patch_ollama_httpx_client):
    """模型輸出精確符合 tool_call marker 格式時，應被解析成 ToolCallRequest，
    而不是被當成一般文字內容。
    """
    marker_response = '```tool_call\n{"name": "clock", "arguments": {}}\n```'
    patch_ollama_httpx_client(
        post_result=FakeHttpxResponse(200, {"message": {"content": marker_response}})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")
    tools = [ToolSpec(name="clock", description="回傳目前時間", parameters={})]

    result = await provider.generate(
        [{"role": "user", "content": "現在幾點？"}], tools=tools
    )

    assert result.content is None
    assert len(result.tool_calls) == 1
    assert result.tool_calls[0].name == "clock"
    assert result.tool_calls[0].arguments == {}


@pytest.mark.asyncio
async def test_generate_with_tools_malformed_marker_falls_back_to_plain_content(
    patch_ollama_httpx_client,
):
    """marker 格式不符（例如缺少 name 欄位）時，fail-safe 視為普通文字，
    不拋出例外、不產生殘缺的 tool call。
    """
    malformed_response = '```tool_call\n{"arguments": {}}\n```'
    patch_ollama_httpx_client(
        post_result=FakeHttpxResponse(200, {"message": {"content": malformed_response}})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="fixture-model:unit")
    tools = [ToolSpec(name="clock", description="回傳目前時間", parameters={})]

    result = await provider.generate(
        [{"role": "user", "content": "現在幾點？"}], tools=tools
    )

    assert result.tool_calls == []
    assert result.content == malformed_response


@pytest.mark.asyncio
async def test_tool_response_keeps_generation_metadata(patch_ollama_httpx_client):
    payload = {"message": {"content": '```tool_call\n{"name":"clock","arguments":{}}\n```'},
               "done_reason": "stop", "eval_count": 15}
    patch_ollama_httpx_client(post_result=FakeHttpxResponse(200, payload))
    provider = OllamaModelProvider("http://127.0.0.1:11434", "fixture-model:unit")
    response = await provider.generate([{"role": "user", "content": "time"}], tools=[ToolSpec("clock")])
    assert response.tool_calls[0].name == "clock"
    assert response.raw == payload


@pytest.mark.asyncio
@pytest.mark.parametrize("exception,code", [
    (httpx.ConnectError("password=private-value"), "connection_error"),
    (httpx.ReadTimeout("password=private-value"), "request_timeout"),
    (ValueError("password=private-value"), "generation_error"),
])
async def test_failure_has_safe_error_code(patch_ollama_httpx_client, capsys, exception, code):
    patch_ollama_httpx_client(post_exception=exception)
    response = await OllamaModelProvider("http://127.0.0.1:11434", "fixture-model:unit").generate([])
    assert response.raw == {"error_code": code}
    assert "private-value" not in capsys.readouterr().out


@pytest.mark.asyncio
async def test_http_failure_keeps_status_without_logging_response_body(patch_ollama_httpx_client, capsys):
    patch_ollama_httpx_client(post_result=FakeHttpxResponse(503, text="password=private-value"))
    response = await OllamaModelProvider("http://127.0.0.1:11434", "fixture-model:unit").generate([])
    assert response.raw == {"error_code": "http_error", "http_status": 503}
    assert "private-value" not in capsys.readouterr().out


@pytest.mark.asyncio
@pytest.mark.parametrize("endpoint", ["http://127.0.0.1:11434", "http://localhost:11434", "http://[::1]:11434"])
async def test_loopback_inference_works_with_unsupported_environment_proxy(monkeypatch, endpoint):
    # Use the real httpx client initialization: mocking AsyncClient itself would
    # hide the httpx 0.27 ALL_PROXY parsing failure this regression covers.
    monkeypatch.setenv("ALL_PROXY", "socks5h://127.0.0.1:1")
    monkeypatch.setenv("HTTP_PROXY", "http://127.0.0.1:1")
    monkeypatch.setenv("NO_PROXY", "")
    async def send(client, request, **kwargs):
        assert str(request.url) == endpoint + "/api/chat"
        assert client._trust_env is False
        return httpx.Response(200, json={"message": {"content": "local-success"}}, request=request)
    monkeypatch.setattr(httpx.AsyncClient, "send", send)
    response = await OllamaModelProvider(endpoint, "fixture-model:unit").generate([])
    assert response.content == "local-success"
    assert not response.raw.get("error_code")


@pytest.mark.asyncio
async def test_structured_mode_without_tools_preserves_plain_chat(patch_ollama_httpx_client):
    calls = patch_ollama_httpx_client(post_result=FakeHttpxResponse(200, {"message": {"content": "plain reply"}}))
    provider = OllamaModelProvider("http://127.0.0.1:11434", "fixture-model:unit", tool_call_mode="json_schema")
    messages = [{"role": "user", "content": "hello"}]
    response = await provider.generate(messages, tools=[])
    assert response.content == "plain reply"
    assert calls[0][2]["messages"] == messages
    assert "format" not in calls[0][2]


@pytest.mark.asyncio
async def test_required_initial_call_applies_to_current_turn_not_old_history(patch_ollama_httpx_client):
    calls = patch_ollama_httpx_client(post_result=FakeHttpxResponse(200, {"message": {"content": '{"answer":"unused"}'}}))
    provider = OllamaModelProvider("http://127.0.0.1:11434", "fixture-model:unit", tool_call_mode="json_schema")
    await provider.generate([
        {"role": "user", "content": "previous request"},
        {"role": "tool", "content": {"content": "old result"}},
        {"role": "user", "content": "new request"},
    ], tools=[ToolSpec("clock")], require_initial_tool=True)
    assert calls[0][2]["format"]["required"] == ["tool_call"]
