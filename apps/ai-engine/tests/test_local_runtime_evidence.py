"""Synthetic evidence-validator tests; do not certify hardware or a model."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import pytest

SCRIPT = Path(__file__).parents[1] / "scripts" / "verify_local_runtime.py"
SPEC = importlib.util.spec_from_file_location("verify_local_runtime", SCRIPT)
probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(probe)


def test_bare_and_prefixed_sha256_are_equivalent():
    digest = "a1" * 32
    assert probe.normalize_digest(digest) == probe.normalize_digest("sha256:" + digest)
    assert probe.normalize_digest("b2" * 32) != probe.normalize_digest(digest)


@pytest.mark.parametrize("value", [None, "", "a1" * 6, "sha256:" + "z" * 64])
def test_missing_truncated_and_invalid_digests_are_rejected(value):
    with pytest.raises(ValueError):
        probe.normalize_digest(value)


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
