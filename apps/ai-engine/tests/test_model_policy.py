"""Policy rejection tests never download or execute model weights."""
import importlib

import pytest

from agent import build_default_agent_core, build_read_only_agent_core
from agent.providers.ollama_provider import OllamaModelProvider
from model_policy import validate_model_selection


@pytest.mark.parametrize("model", [
    "qwen2.5:3b", " QWEN3:8b ", "org/Qwen2.5-7B-Instruct",
    "registry.example/derived-qwen:latest", "Ｑｗｅｎ:unit",
])
def test_prohibited_model_rejected_at_provider_boundary(model):
    with pytest.raises(ValueError, match="prohibited"):
        OllamaModelProvider("http://unused.invalid", model)


def test_all_builders_reject_prohibited_model(tmp_path):
    with pytest.raises(ValueError, match="prohibited"):
        build_default_agent_core("http://unused.invalid", "Qwen:unit")
    with pytest.raises(ValueError, match="prohibited"):
        build_read_only_agent_core("http://unused.invalid", "Qwen:unit", str(tmp_path))


def test_unset_config_disables_inference_and_environment_override_is_rejected(monkeypatch):
    import config
    monkeypatch.setattr("dotenv.load_dotenv", lambda: None)
    monkeypatch.delenv("OLLAMA_MODEL", raising=False)
    assert importlib.reload(config).OLLAMA_MODEL == ""
    monkeypatch.setenv("OLLAMA_MODEL", "org/Qwen:unit")
    try:
        with pytest.raises(ValueError, match="prohibited"):
            importlib.reload(config)
    finally:
        monkeypatch.delenv("OLLAMA_MODEL", raising=False)
        importlib.reload(config)


@pytest.mark.asyncio
async def test_disabled_provider_makes_no_http_calls(monkeypatch):
    def unexpected_http(*args, **kwargs):
        pytest.fail("Disabled inference must never access HTTP")
    monkeypatch.setattr("httpx.AsyncClient", unexpected_http)
    provider = OllamaModelProvider("http://unused.invalid", "  ")
    assert "未啟用" in (await provider.generate([])).content
    assert await provider.health_check() == {
        "status": "disabled", "model": None, "model_available": False,
    }


@pytest.mark.asyncio
async def test_mutated_selection_is_rechecked_before_http(monkeypatch):
    def unexpected_http(*args, **kwargs):
        pytest.fail("Prohibited inference must never access HTTP")
    monkeypatch.setattr("httpx.AsyncClient", unexpected_http)
    provider = OllamaModelProvider("http://unused.invalid", "fixture-model:unit")
    provider.model = "Qwen:unit"
    with pytest.raises(ValueError, match="prohibited"):
        await provider.generate([])
    with pytest.raises(ValueError, match="prohibited"):
        await provider.health_check()


def test_explicit_nonblocked_identifier_preserved_without_claiming_approval():
    assert validate_model_selection(" fixture-model:unit ") == "fixture-model:unit"
