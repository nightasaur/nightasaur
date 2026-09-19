"""Synthetic evidence-validator tests; do not certify hardware or a model."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace

SCRIPT = Path(__file__).parents[1] / "scripts" / "verify_local_runtime.py"
SPEC = importlib.util.spec_from_file_location("verify_local_runtime", SCRIPT)
probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(probe)


def result(content, trace):
    return SimpleNamespace(content=content, metadata={"tool_trace": trace})


def test_answer_without_tool_evidence_is_rejected():
    assert not probe.accepts(result("fixture-value", []), "fixture-value")


def test_failed_or_wrong_tool_cannot_certify_runtime():
    trace = [{"name": "workspace_inspect", "ok": False,
              "arguments": {"action": "read", "path": "challenge.txt"}}]
    assert not probe.accepts(result("fixture-value", trace), "fixture-value")
    trace[0].update(ok=True, name="workspace_patch")
    assert not probe.accepts(result("fixture-value", trace), "fixture-value")


def test_grounded_read_requires_exact_answer():
    trace = [{"name": "workspace_inspect", "ok": True,
              "arguments": {"action": "read", "path": "challenge.txt"}}]
    assert probe.accepts(result("fixture-value", trace), "fixture-value")
    assert not probe.accepts(result("offline", trace), "fixture-value")


def test_snapshot_detects_added_and_modified_files(tmp_path):
    (tmp_path / "challenge.txt").write_text("before")
    before = probe.snapshot(tmp_path)
    (tmp_path / "challenge.txt").write_text("after")
    assert before != probe.snapshot(tmp_path)
    (tmp_path / "challenge.txt").write_text("before")
    (tmp_path / "extra").mkdir()
    assert before != probe.snapshot(tmp_path)
