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
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")

    result = await provider.generate([{"role": "user", "content": "hi"}])

    assert result.content == "哈囉！"


@pytest.mark.asyncio
async def test_generate_sends_expected_request_payload(patch_ollama_httpx_client):
    calls = patch_ollama_httpx_client(
        post_result=FakeHttpxResponse(200, {"message": {"content": "ok"}})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")
    messages = [{"role": "system", "content": "sys"}, {"role": "user", "content": "hi"}]

    await provider.generate(messages, temperature=0.1, top_p=0.5, num_predict=32)

    assert len(calls) == 1
    method, url, payload = calls[0]
    assert method == "post"
    assert url == "http://ollama.local/api/chat"
    assert payload == {
        "model": "qwen2.5:3b",
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.1, "top_p": 0.5, "num_predict": 32},
    }


@pytest.mark.asyncio
async def test_generate_non_200_returns_default_fallback_message(patch_ollama_httpx_client):
    patch_ollama_httpx_client(post_result=FakeHttpxResponse(500, text="boom"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")

    result = await provider.generate([{"role": "user", "content": "hi"}])

    assert result.content == "嗚...我暫時無法回應。請稍後再試。"


@pytest.mark.asyncio
async def test_generate_non_200_uses_custom_fallback_message(patch_ollama_httpx_client):
    """驗證 services/assistant_llm.py 透過 model_options 傳入的自訂
    fallback_message 會被實際使用（AgentInput.model_options 契約）。
    """
    patch_ollama_httpx_client(post_result=FakeHttpxResponse(500, text="boom"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")

    result = await provider.generate(
        [{"role": "user", "content": "hi"}],
        fallback_message="抱歉，我暫時無法回應。請稍後再試。",
    )

    assert result.content == "抱歉，我暫時無法回應。請稍後再試。"


@pytest.mark.asyncio
async def test_generate_connect_error_returns_offline_message(patch_ollama_httpx_client):
    patch_ollama_httpx_client(post_exception=httpx.ConnectError("cannot connect"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")

    result = await provider.generate([{"role": "user", "content": "hi"}])

    assert result.content == "嘎嗚～（AI 引擎尚未啟動，請先執行 Ollama）"


@pytest.mark.asyncio
async def test_generate_generic_exception_returns_error_message(patch_ollama_httpx_client):
    patch_ollama_httpx_client(post_exception=RuntimeError("unexpected"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")

    result = await provider.generate([{"role": "user", "content": "hi"}])

    assert result.content == "嘎嗚～（通訊暫時中斷...）"


@pytest.mark.asyncio
async def test_health_check_success_reports_model_available(patch_ollama_httpx_client):
    patch_ollama_httpx_client(
        get_result=FakeHttpxResponse(
            200, {"models": [{"name": "qwen2.5:3b"}, {"name": "llama3"}]}
        )
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")

    result = await provider.health_check()

    assert result == {
        "status": "ok",
        "model": "qwen2.5:3b",
        "model_available": True,
        "available_models": ["qwen2.5:3b", "llama3"],
    }


@pytest.mark.asyncio
async def test_health_check_success_reports_model_not_available(patch_ollama_httpx_client):
    patch_ollama_httpx_client(
        get_result=FakeHttpxResponse(200, {"models": [{"name": "llama3"}]})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")

    result = await provider.health_check()

    assert result["model_available"] is False


@pytest.mark.asyncio
async def test_health_check_non_200_returns_error_status(patch_ollama_httpx_client):
    patch_ollama_httpx_client(get_result=FakeHttpxResponse(503, text="unavailable"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")

    result = await provider.health_check()

    assert result == {"status": "error", "message": "HTTP 503"}


@pytest.mark.asyncio
async def test_health_check_exception_returns_offline_status(patch_ollama_httpx_client):
    patch_ollama_httpx_client(get_exception=RuntimeError("network down"))
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")

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
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")
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
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")
    messages = [{"role": "user", "content": "現在幾點？"}]
    tools = [ToolSpec(name="clock", description="回傳目前時間", parameters={})]

    result = await provider.generate(messages, tools=tools)

    assert result.content == "一般回覆，不需要工具"
    _, _, payload = calls[0]
    assert len(payload["messages"]) == len(messages) + 1
    assert payload["messages"][0]["role"] == "system"
    assert "clock" in payload["messages"][0]["content"]


@pytest.mark.asyncio
async def test_generate_with_tools_parses_valid_tool_call_marker(patch_ollama_httpx_client):
    """模型輸出精確符合 tool_call marker 格式時，應被解析成 ToolCallRequest，
    而不是被當成一般文字內容。
    """
    marker_response = '```tool_call\n{"name": "clock", "arguments": {}}\n```'
    patch_ollama_httpx_client(
        post_result=FakeHttpxResponse(200, {"message": {"content": marker_response}})
    )
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")
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
    provider = OllamaModelProvider(base_url="http://ollama.local", model="qwen2.5:3b")
    tools = [ToolSpec(name="clock", description="回傳目前時間", parameters={})]

    result = await provider.generate(
        [{"role": "user", "content": "現在幾點？"}], tools=tools
    )

    assert result.tool_calls == []
    assert result.content == malformed_response
