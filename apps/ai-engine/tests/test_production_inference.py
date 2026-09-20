import httpx
import pytest

from agent.providers.production_ollama import InferenceUnavailable, ProductionOllamaModelProvider

DIGEST = "ab" * 32


@pytest.mark.asyncio
@pytest.mark.parametrize("actual,done,tokens,expected", [
    (DIGEST, True, 12, None),
    ("cd" * 32, True, 12, "model_digest_mismatch"),
    (DIGEST, False, 12, "inference_not_completed"),
    (DIGEST, True, 0, "inference_not_completed"),
])
async def test_pinned_inference_requires_actual_completion(monkeypatch, actual, done, tokens, expected):
    monkeypatch.setenv("OLLAMA_EXPECTED_DIGEST", "sha256:" + DIGEST)
    calls = []
    async def send(client, request, **kwargs):
        calls.append(request.url.path)
        data = ({"models": [{"name": "fixture-model:unit", "digest": actual}]}
                if request.url.path == "/api/tags" else
                {"message": {"content": "actual model answer"}, "done": done, "eval_count": tokens})
        return httpx.Response(200, json=data, request=request)
    monkeypatch.setattr(httpx.AsyncClient, "send", send)
    provider = ProductionOllamaModelProvider("http://127.0.0.1:11434", "fixture-model:unit")
    if expected:
        with pytest.raises(InferenceUnavailable, match=expected):
            await provider.generate([])
    else:
        assert (await provider.generate([])).content == "actual model answer"
    if actual != DIGEST:
        assert calls == ["/api/tags"]


@pytest.mark.asyncio
async def test_missing_digest_refuses_network_and_empty_model(monkeypatch):
    monkeypatch.delenv("OLLAMA_EXPECTED_DIGEST", raising=False)
    provider = ProductionOllamaModelProvider("http://127.0.0.1:1", "fixture-model:unit")
    with pytest.raises(InferenceUnavailable, match="reviewed_model_not_configured"):
        await provider.generate([])


@pytest.mark.asyncio
async def test_production_does_not_return_offline_friendly_text(monkeypatch):
    monkeypatch.setenv("OLLAMA_EXPECTED_DIGEST", DIGEST)
    async def send(client, request, **kwargs):
        if request.url.path == "/api/tags":
            return httpx.Response(200, json={"models": [{"name": "fixture-model:unit", "digest": DIGEST}]}, request=request)
        raise httpx.ConnectError("private data must not escape")
    monkeypatch.setattr(httpx.AsyncClient, "send", send)
    with pytest.raises(InferenceUnavailable, match="inference_not_completed"):
        await ProductionOllamaModelProvider("http://127.0.0.1:1", "fixture-model:unit").generate([])


@pytest.mark.asyncio
async def test_ops_probe_requires_auth_and_maps_provider_failure_to_503(monkeypatch):
    import main
    from services.assistant_llm import assistant_llm_service
    key = "fixture-service-key-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    monkeypatch.setenv("AI_ENGINE_API_KEY", key)
    provider = ProductionOllamaModelProvider("http://127.0.0.1:1", "fixture-model:unit")
    async def failed(*args, **kwargs):
        raise InferenceUnavailable("provider_unavailable")
    monkeypatch.setattr(provider, "generate", failed)
    monkeypatch.setattr(assistant_llm_service.agent_core, "model_provider", provider)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url="http://test") as client:
        denied = await client.post("/api/ops/verify-inference", json={"challenge": "a" * 32})
        assert denied.status_code == 401
        response = await client.post("/api/ops/verify-inference", json={"challenge": "a" * 32},
                                     headers={"Authorization": "Bearer " + key})
        assert response.status_code == 503
        assert response.json()["code"] == "provider_unavailable"


@pytest.mark.asyncio
async def test_ops_probe_uses_structured_actual_generation(monkeypatch):
    import json
    import main
    from services.assistant_llm import assistant_llm_service
    monkeypatch.setenv("OLLAMA_EXPECTED_DIGEST", DIGEST)
    provider=ProductionOllamaModelProvider("http://127.0.0.1:11434", "fixture-model:unit")
    monkeypatch.setattr(assistant_llm_service.agent_core,"model_provider",provider)
    challenge="0123456789abcdef"*2
    async def send(client,request,**kwargs):
        if request.url.path=="/api/tags":
            return httpx.Response(200,json={"models":[{"name":provider.model,"digest":DIGEST}]},request=request)
        payload=json.loads(request.content)
        assert payload["format"]["properties"]["challenge"]["enum"]==[challenge]
        return httpx.Response(200,json={"message":{"content":json.dumps({"challenge":challenge})},"done":True,"eval_count":35},request=request)
    monkeypatch.setattr(httpx.AsyncClient,"send",send)
    result=await main.verify_inference(main.InferenceCheck(challenge=challenge))
    assert result["verified"] and result["generated_tokens"]==35
