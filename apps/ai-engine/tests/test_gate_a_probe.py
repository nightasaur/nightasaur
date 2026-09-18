import importlib.util
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts" / "gate_a_probe.py"
SPEC = importlib.util.spec_from_file_location("gate_a_probe", SCRIPT)
gate_a_probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gate_a_probe)


def test_build_report_requires_every_gate_check(monkeypatch):
    monkeypatch.setattr(gate_a_probe.platform, "system", lambda: "Windows")
    monkeypatch.setattr(gate_a_probe.platform, "release", lambda: "11")
    monkeypatch.setattr(gate_a_probe, "_check_gpu", lambda: {"ok": True})
    monkeypatch.setattr(
        gate_a_probe, "_check_ollama", lambda *_: {"ok": True}
    )

    report = gate_a_probe.build_report("http://127.0.0.1:11434", "qwen2.5:3b")

    assert report["verified"] is True
    assert report["mode"] == "read-only"


def test_build_report_fails_closed_outside_windows_11(monkeypatch):
    monkeypatch.setattr(gate_a_probe.platform, "system", lambda: "Linux")
    monkeypatch.setattr(gate_a_probe.platform, "release", lambda: "6")
    monkeypatch.setattr(gate_a_probe, "_check_gpu", lambda: {"ok": True})
    monkeypatch.setattr(
        gate_a_probe, "_check_ollama", lambda *_: {"ok": True}
    )

    report = gate_a_probe.build_report("http://127.0.0.1:11434", "qwen2.5:3b")

    assert report["verified"] is False
    assert report["checks"]["windows_11"]["ok"] is False
