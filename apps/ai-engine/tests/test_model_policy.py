"""Policy rejection tests never download or execute model weights."""
import importlib

import pytest

from agent import build_default_agent_core, build_read_only_agent_core
from agent.providers.ollama_provider import OllamaModelProvider
from model_policy import validate_model_selection


PROHIBITED = "".join(chr(codepoint) for codepoint in (113, 119, 101, 110))

@pytest.mark.parametrize("model", [
    f"{PROHIBITED}2.5:3b", f" {PROHIBITED.upper()}3:8b ",
    f"org/{PROHIBITED.title()}2.5-7B-Instruct",
    f"registry.example/derived-{PROHIBITED}:latest",
    "".join(chr(codepoint) for codepoint in (0xFF31, 0xFF57, 0xFF45, 0xFF4E)) + ":unit",
])
def test_prohibited_model_rejected_at_provider_boundary(model):
    with pytest.raises(ValueError, match="prohibited"):
        OllamaModelProvider("http://unused.invalid", model)


def test_all_builders_reject_prohibited_model(tmp_path):
    with pytest.raises(ValueError, match="prohibited"):
        build_default_agent_core("http://unused.invalid", f"{PROHIBITED}:unit")
    with pytest.raises(ValueError, match="prohibited"):
        build_read_only_agent_core("http://unused.invalid", f"{PROHIBITED}:unit", str(tmp_path))


def test_unset_config_disables_inference_and_environment_override_is_rejected(monkeypatch):
    import config
    monkeypatch.setattr("dotenv.load_dotenv", lambda: None)
    monkeypatch.delenv("OLLAMA_MODEL", raising=False)
    assert importlib.reload(config).OLLAMA_MODEL == ""
    monkeypatch.setenv("OLLAMA_MODEL", f"org/{PROHIBITED}:unit")
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
    provider.model = f"{PROHIBITED}:unit"
    with pytest.raises(ValueError, match="prohibited"):
        await provider.generate([])
    with pytest.raises(ValueError, match="prohibited"):
        await provider.health_check()


def test_explicit_nonblocked_identifier_preserved_without_claiming_approval():
    assert validate_model_selection(" fixture-model:unit ") == "fixture-model:unit"
