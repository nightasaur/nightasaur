import importlib.util
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts" / "gate_a_probe.py"
SPEC = importlib.util.spec_from_file_location("gate_a_probe", SCRIPT)
gate_a_probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gate_a_probe)
PROHIBITED = "".join(chr(codepoint) for codepoint in (113, 119, 101, 110))


def test_probe_rejects_missing_and_prohibited_models_without_network(monkeypatch):
    def unexpected_http(*args, **kwargs):
        raise AssertionError("No HTTP allowed for disabled/prohibited model")
    monkeypatch.setattr(gate_a_probe, "urlopen", unexpected_http)
    assert gate_a_probe._check_ollama("http://unused.invalid", "") == {
        "ok": False, "error": "model_not_configured",
    }
    assert gate_a_probe._check_ollama("http://unused.invalid", f"{PROHIBITED}:unit") == {
        "ok": False, "error": "model_prohibited",
    }


def test_build_report_requires_every_gate_check(monkeypatch):
    monkeypatch.setattr(gate_a_probe.platform, "system", lambda: "Windows")
    monkeypatch.setattr(gate_a_probe.platform, "release", lambda: "11")
    monkeypatch.setattr(gate_a_probe.platform, "version", lambda: "10.0.22000")
    monkeypatch.setattr(gate_a_probe, "_check_gpu", lambda: {"ok": True})
    monkeypatch.setattr(
        gate_a_probe, "_check_ollama", lambda *_: {"ok": True}
    )

    report = gate_a_probe.build_report("http://127.0.0.1:11434", "fixture-model:unit")

    assert report["environment_ready"] is True
    assert report["verified"] is False
    assert report["status"] == "ENVIRONMENT_ONLY"
    assert report["mode"] == "read-only"


def test_build_report_fails_closed_outside_windows_11(monkeypatch):
    monkeypatch.setattr(gate_a_probe.platform, "system", lambda: "Linux")
    monkeypatch.setattr(gate_a_probe.platform, "release", lambda: "6")
    monkeypatch.setattr(gate_a_probe.platform, "version", lambda: "6.0.0")
    monkeypatch.setattr(gate_a_probe, "_check_gpu", lambda: {"ok": True})
    monkeypatch.setattr(
        gate_a_probe, "_check_ollama", lambda *_: {"ok": True}
    )

    report = gate_a_probe.build_report("http://127.0.0.1:11434", "fixture-model:unit")

    assert report["verified"] is False
    assert report["checks"]["windows_11"]["ok"] is False


def test_windows_11_accepts_nt_10_release_with_modern_build(monkeypatch):
    monkeypatch.setattr(gate_a_probe.platform, "system", lambda: "Windows")
    monkeypatch.setattr(gate_a_probe.platform, "release", lambda: "10")
    monkeypatch.setattr(gate_a_probe.platform, "version", lambda: "10.0.26200")

    result = gate_a_probe._check_windows_11()

    assert result["ok"] is True
    assert result["build"] == 26200


def test_windows_10_build_remains_rejected(monkeypatch):
    monkeypatch.setattr(gate_a_probe.platform, "system", lambda: "Windows")
    monkeypatch.setattr(gate_a_probe.platform, "release", lambda: "10")
    monkeypatch.setattr(gate_a_probe.platform, "version", lambda: "10.0.19045")

    result = gate_a_probe._check_windows_11()

    assert result["ok"] is False
    assert result["build"] == 19045
