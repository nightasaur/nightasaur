# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""W5 v0.6 bounded Coding Tool Loop safety and orchestration tests."""

import hashlib

import pytest

from agent import WorkspaceWriteApproval, build_coding_agent_core
from agent.core import AgentCore
from agent.execution_policy import CodingExecutionPolicy, ExecutionDecision
from agent.memory.in_memory import EphemeralMemoryProvider
from agent.schemas import AgentInput
from agent.tool_calls import ModelResponse, ToolCallRequest, ToolSpec
from agent.tools.registry import ToolRegistry
from agent.tools.workspace_inspect import WorkspaceInspectTool
from agent.tools.workspace_patch import WorkspacePatchTool
from tests.conftest import FakeModelProvider


def _sha256(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _patch_spec() -> ToolSpec:
    return ToolSpec(name="workspace_patch", read_only=False)


def _core(tmp_path, provider, *, approved_writes=None) -> AgentCore:
    registry = ToolRegistry()
    registry.register(WorkspaceInspectTool(tmp_path))
    registry.register(
        WorkspacePatchTool(
            tmp_path,
            allowed_paths=("src", "docs"),
            allowed_suffixes=(".py", ".md"),
        )
    )
    return AgentCore(
        model_provider=provider,
        tool_registry=registry,
        memory_provider=EphemeralMemoryProvider(),
        execution_policy=CodingExecutionPolicy(approved_writes),
    )


def test_coding_policy_allows_reads_and_patch_previews():
    policy = CodingExecutionPolicy()

    read = ToolCallRequest(id="read", name="workspace_inspect", arguments={})
    preview = ToolCallRequest(
        id="preview",
        name="workspace_patch",
        arguments={"path": "src/app.py", "content": "new\n"},
    )

    assert policy.evaluate(
        read, ToolSpec(name="workspace_inspect", read_only=True), {}
    ) is ExecutionDecision.ALLOW
    assert policy.evaluate(preview, _patch_spec(), {}) is ExecutionDecision.ALLOW


def test_coding_policy_requires_exact_path_and_source_hash_approval():
    current_sha = _sha256("old\n")
    after_sha = _sha256("new\n")
    approved = CodingExecutionPolicy(
        [WorkspaceWriteApproval("src/app.py", current_sha, after_sha)]
    )
    unapproved = CodingExecutionPolicy()
    apply_call = ToolCallRequest(
        id="apply",
        name="workspace_patch",
        arguments={
            "path": r"src\app.py",
            "content": "new\n",
            "dry_run": False,
            "expected_sha256": current_sha.upper(),
        },
    )

    assert approved.evaluate(apply_call, _patch_spec(), {}) is ExecutionDecision.ALLOW
    assert unapproved.evaluate(
        apply_call, _patch_spec(), {}
    ) is ExecutionDecision.CONFIRMATION_REQUIRED

    wrong_hash_call = ToolCallRequest(
        id="wrong-hash",
        name="workspace_patch",
        arguments={**apply_call.arguments, "expected_sha256": "0" * 64},
    )
    assert approved.evaluate(
        wrong_hash_call, _patch_spec(), {}
    ) is ExecutionDecision.CONFIRMATION_REQUIRED

    wrong_content_call = ToolCallRequest(
        id="wrong-content",
        name="workspace_patch",
        arguments={**apply_call.arguments, "content": "different\n"},
    )
    assert approved.evaluate(
        wrong_content_call, _patch_spec(), {}
    ) is ExecutionDecision.CONFIRMATION_REQUIRED


@pytest.mark.parametrize(
    ("call", "spec"),
    (
        (
            ToolCallRequest(id="unknown", name="unknown", arguments={}),
            None,
        ),
        (
            ToolCallRequest(id="shell", name="shell", arguments={}),
            ToolSpec(name="shell", read_only=False),
        ),
        (
            ToolCallRequest(
                id="missing-hash",
                name="workspace_patch",
                arguments={"path": "src/app.py", "content": "new", "dry_run": False},
            ),
            _patch_spec(),
        ),
        (
            ToolCallRequest(
                id="bad-dry-run",
                name="workspace_patch",
                arguments={"path": "src/app.py", "content": "new", "dry_run": 0},
            ),
            _patch_spec(),
        ),
    ),
)
def test_coding_policy_denies_unknown_or_malformed_mutation_calls(call, spec):
    assert CodingExecutionPolicy().evaluate(call, spec, {}) is ExecutionDecision.DENY


def test_coding_policy_rejects_invalid_constructor_approvals():
    with pytest.raises(ValueError, match="workspace-relative"):
        CodingExecutionPolicy(
            [WorkspaceWriteApproval("../outside.py", "0" * 64, "1" * 64)]
        )
    with pytest.raises(ValueError, match="SHA-256"):
        CodingExecutionPolicy(
            [WorkspaceWriteApproval("src/app.py", "not-a-digest", "1" * 64)]
        )


@pytest.mark.asyncio
async def test_coding_loop_inspects_then_previews_without_mutating(tmp_path):
    target = tmp_path / "src" / "app.py"
    target.parent.mkdir()
    target.write_text("value = 1\n", encoding="utf-8")
    provider = FakeModelProvider(
        responses=[
            ModelResponse(
                tool_calls=[
                    ToolCallRequest(
                        id="inspect",
                        name="workspace_inspect",
                        arguments={"action": "read", "path": "src/app.py"},
                    )
                ]
            ),
            ModelResponse(
                tool_calls=[
                    ToolCallRequest(
                        id="preview",
                        name="workspace_patch",
                        arguments={
                            "path": "src/app.py",
                            "content": "value = 2\n",
                            "dry_run": True,
                        },
                    )
                ]
            ),
            ModelResponse(content="Preview ready; no file was changed."),
        ]
    )

    output = await _core(tmp_path, provider).run(AgentInput(message="Update value"))

    assert output.content == "Preview ready; no file was changed."
    assert target.read_text(encoding="utf-8") == "value = 1\n"
    assert output.metadata["iterations"] == 2
    assert [entry["name"] for entry in output.metadata["tool_trace"]] == [
        "workspace_inspect",
        "workspace_patch",
    ]
    assert all(entry["ok"] for entry in output.metadata["tool_trace"])


@pytest.mark.asyncio
async def test_coding_loop_applies_only_a_preapproved_exact_source(tmp_path):
    target = tmp_path / "src" / "app.py"
    target.parent.mkdir()
    target.write_text("value = 1\n", encoding="utf-8")
    current_sha = _sha256("value = 1\n")
    call = ToolCallRequest(
        id="apply",
        name="workspace_patch",
        arguments={
            "path": "src/app.py",
            "content": "value = 2\n",
            "dry_run": False,
            "expected_sha256": current_sha,
        },
    )
    provider = FakeModelProvider(
        responses=[ModelResponse(tool_calls=[call]), ModelResponse(content="Applied.")]
    )

    output = await _core(
        tmp_path,
        provider,
        approved_writes=[
            WorkspaceWriteApproval(
                "src/app.py", current_sha, _sha256("value = 2\n")
            )
        ],
    ).run(AgentInput(message="Apply the approved edit"))

    assert output.content == "Applied."
    assert target.read_text(encoding="utf-8") == "value = 2\n"
    assert output.metadata["tool_trace"][0]["ok"] is True
    assert output.metadata["tool_trace"][0]["result"]["applied"] is True


@pytest.mark.asyncio
async def test_coding_loop_never_applies_an_unapproved_write(tmp_path):
    target = tmp_path / "src" / "app.py"
    target.parent.mkdir()
    target.write_text("value = 1\n", encoding="utf-8")
    call = ToolCallRequest(
        id="apply",
        name="workspace_patch",
        arguments={
            "path": "src/app.py",
            "content": "value = 2\n",
            "dry_run": False,
            "expected_sha256": _sha256("value = 1\n"),
        },
    )
    provider = FakeModelProvider(
        responses=[
            ModelResponse(tool_calls=[call]),
            ModelResponse(content="Waiting for approval."),
        ]
    )

    output = await _core(tmp_path, provider).run(
        AgentInput(message="Apply without approval")
    )

    assert target.read_text(encoding="utf-8") == "value = 1\n"
    assert output.metadata["tool_trace"][0]["ok"] is False
    assert "confirmation_required" in output.metadata["tool_trace"][0]["error"]


def test_coding_builder_is_opt_in_and_registers_only_bounded_tools(tmp_path):
    (tmp_path / "src").mkdir()
    core = build_coding_agent_core(
        "http://localhost:11434",
        "qwen2.5:3b",
        str(tmp_path),
        allowed_write_paths=("src",),
    )

    assert [spec.name for spec in core.tools.list_specs()] == [
        "workspace_inspect",
        "workspace_patch",
    ]
    assert isinstance(core.execution_policy, CodingExecutionPolicy)
