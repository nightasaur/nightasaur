# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

from pathlib import Path

import pytest

from agent.execution_policy import ExecutionDecision, ReadOnlyExecutionPolicy
from agent.tool_calls import ToolCallRequest, ToolSpec
from agent.tools.base import Tool
from agent.tools.registry import ToolRegistry
from agent.tools.workspace_inspect import WorkspaceInspectTool


class MutatingTool(Tool):
    name = "write_file"
    description = "Mutates a file."

    async def run(self, **kwargs):
        raise AssertionError("must never execute in read-only runtime")


def _decision(spec):
    call = ToolCallRequest(id="1", name="inspect", arguments={})
    return ReadOnlyExecutionPolicy().evaluate(call, spec, context={})


def test_read_only_policy_allows_explicit_read_only_spec():
    spec = ToolSpec(name="inspect", read_only=True)
    assert _decision(spec) is ExecutionDecision.ALLOW


@pytest.mark.parametrize(
    "spec",
    [None, ToolSpec(name="inspect"), ToolSpec(name="other", read_only=True)],
)
def test_read_only_policy_denies_unknown_legacy_or_mismatched_specs(spec):
    assert _decision(spec) is ExecutionDecision.DENY


def test_registry_propagates_read_only_declaration():
    registry = ToolRegistry()
    registry.register(WorkspaceInspectTool(Path.cwd()))
    registry.register(MutatingTool())
    specs = {spec.name: spec for spec in registry.list_specs()}
    assert specs["workspace_inspect"].read_only is True
    assert specs["write_file"].read_only is False


@pytest.mark.asyncio
async def test_workspace_inspect_reads_bounded_utf8_file(tmp_path):
    target = tmp_path / "src" / "hello.txt"
    target.parent.mkdir()
    target.write_text("hello runtime", encoding="utf-8")
    tool = WorkspaceInspectTool(tmp_path)

    result = await tool.run(action="read", path="src/hello.txt")

    assert result == {
        "path": "src/hello.txt",
        "content": "hello runtime",
        "size": 13,
    }


@pytest.mark.asyncio
async def test_workspace_inspect_lists_entries_without_sensitive_paths(tmp_path):
    (tmp_path / "safe.txt").write_text("ok", encoding="utf-8")
    (tmp_path / ".env").write_text("TOKEN=nope", encoding="utf-8")
    (tmp_path / ".env.production").write_text("TOKEN=nope", encoding="utf-8")
    tool = WorkspaceInspectTool(tmp_path)

    result = await tool.run(action="list", path=".")

    assert result["entries"] == [{"name": "safe.txt", "kind": "file"}]


@pytest.mark.asyncio
@pytest.mark.parametrize("path", ["../outside.txt", "/etc/passwd", ".env", ".env.local", ".npmrc"])
async def test_workspace_inspect_rejects_escape_absolute_and_sensitive_paths(
    tmp_path, path
):
    tool = WorkspaceInspectTool(tmp_path)
    with pytest.raises((ValueError, FileNotFoundError)):
        await tool.run(action="read", path=path)


@pytest.mark.asyncio
async def test_workspace_inspect_rejects_symlink_escape(tmp_path):
    outside = tmp_path.parent / "outside.txt"
    outside.write_text("outside", encoding="utf-8")
    link = tmp_path / "link.txt"
    try:
        link.symlink_to(outside)
    except OSError:
        pytest.skip("symlink creation is unavailable on this platform")

    tool = WorkspaceInspectTool(tmp_path)
    with pytest.raises(ValueError, match="symbolic links"):
        await tool.run(action="read", path="link.txt")


@pytest.mark.asyncio
async def test_workspace_inspect_rejects_internal_symlink_to_sensitive_file(tmp_path):
    secret = tmp_path / ".env.production"
    secret.write_text("TOKEN=nope", encoding="utf-8")
    link = tmp_path / "safe-looking.txt"
    try:
        link.symlink_to(secret)
    except OSError:
        pytest.skip("symlink creation is unavailable on this platform")

    tool = WorkspaceInspectTool(tmp_path)
    with pytest.raises(ValueError, match="symbolic links"):
        await tool.run(action="read", path="safe-looking.txt")


@pytest.mark.asyncio
async def test_workspace_inspect_rejects_large_and_binary_files(tmp_path):
    (tmp_path / "large.txt").write_text("x" * 9, encoding="utf-8")
    (tmp_path / "binary.bin").write_bytes(b"a\x00b")
    tool = WorkspaceInspectTool(tmp_path, max_bytes=8)

    with pytest.raises(ValueError, match="read limit"):
        await tool.run(action="read", path="large.txt")
    with pytest.raises(ValueError, match="binary"):
        await tool.run(action="read", path="binary.bin")
