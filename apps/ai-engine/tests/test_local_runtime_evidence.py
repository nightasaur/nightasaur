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


def expected_read(**changes):
    return {"name": "workspace_inspect", "ok": True,
            "arguments": {"action": "read", "path": "challenge.txt"}, **changes}


@pytest.mark.parametrize("content,trace,calls,reason", [
    ("offline", [], [{"error_code": "http_error", "http_status": 503}], "provider_error"),
    ("I cannot read files", [], [], "no_tool_call"),
    (None, [], [], "no_tool_call"),
    ("failed", [expected_read(ok=False)], [], "tool_failed_or_denied"),
    ("fixture-value", [expected_read(arguments={"action": "stat", "path": "challenge.txt"})], [], "expected_read_missing"),
    ("Here is fixture-value", [expected_read()], [], "final_answer_mismatch"),
    ("stopped", [expected_read(), {"event": "max_iterations_reached"}], [], "tool_iteration_limit"),
    ("fixture-value", [expected_read()], [], "passed"),
])
def test_diagnostics_distinguish_runtime_failure_stages(content, trace, calls, reason):
    output = result(content, trace)
    assert probe.diagnose(output, "fixture-value", calls)["reason"] == reason
    assert probe.accepts(output, "fixture-value") is (reason == "passed")


def test_diagnostics_never_emit_raw_responses_paths_or_tool_arguments():
    import json
    from agent.tool_calls import ModelResponse, ToolCallRequest
    private = "C:/Users/private-owner/file.txt password=private-value owner@example.test"
    response = ModelResponse(
        content=private,
        tool_calls=[ToolCallRequest("untrusted-id", private, {"path": private})],
        raw={"message": {"content": private}, "error_code": private, "done_reason": private},
    )
    calls = [probe.response_summary(response, "fixture-value")]
    output = result(private, [expected_read(name=private, arguments={"path": private}, error=private)])
    encoded = json.dumps(probe.diagnose(output, "fixture-value", calls))
    for value in ["private-owner", "private-value", "example.test", "untrusted-id"]:
        assert value not in encoded
    assert calls[0]["error_code"] == "unknown_provider_error"


@pytest.mark.asyncio
async def test_observation_does_not_replace_or_modify_model_response():
    from agent.tool_calls import ModelResponse
    response = ModelResponse(content="real-response", raw={"done_reason": "stop"})
    class Delegate:
        async def generate(self, messages, **kwargs):
            assert messages == [{"role": "user", "content": "request"}]
            assert kwargs == {"temperature": 0}
            return response
    observer = probe.ObservedProvider(Delegate(), "fixture-value")
    returned = await observer.generate([{"role": "user", "content": "request"}], temperature=0)
    assert returned is response
    assert returned.content == "real-response"
    assert observer.calls[0]["answer_matches"] is False
    assert observer.calls[0]["done_reason"] == "stop"


def test_bare_json_is_diagnosed_without_becoming_a_tool_call():
    from agent.tool_calls import ModelResponse
    raw = '{"name":"workspace_inspect","arguments":{"action":"read","path":"challenge.txt"}}'
    summary = probe.response_summary(ModelResponse(content=raw, raw={"message": {"content": raw}}), "fixture-value")
    assert summary["unmarked_tool_json"] is True
    assert summary["tool_call_count"] == 0
    assert summary["answer_matches"] is False


def test_unexpected_provider_metadata_cannot_crash_diagnostics():
    from agent.tool_calls import ModelResponse
    summary = probe.response_summary(ModelResponse(raw={"error_code": {"private": "value"}, "done_reason": []}), "fixture-value")
    assert summary["error_code"] == "unknown_provider_error"
    assert "done_reason" not in summary


@pytest.mark.asyncio
@pytest.mark.parametrize("failure", [TimeoutError(), RuntimeError("private-path")])
async def test_runtime_failure_retains_integrity_checks_and_safe_diagnostics(monkeypatch, failure):
    import agent
    from agent.tool_calls import ModelResponse
    class Delegate:
        async def generate(self, *args, **kwargs):
            return ModelResponse(content="unused")
    class FailingCore:
        model_provider = Delegate()
        async def run(self, request):
            raise failure
    monkeypatch.setattr(agent, "build_read_only_agent_core", lambda *args: FailingCore())
    report = await probe.exercise_runtime("http://127.0.0.1:11434", "fixture-model:unit")
    assert report["real_tool_result_reproduced"] is False
    assert report["fixture_unchanged"] is True
    assert report["diagnostics"]["reason"] == ("runtime_timeout" if isinstance(failure, TimeoutError) else "runtime_error")
    assert "private-path" not in str(report)
