# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

from pathlib import Path

import pytest

from agent.tools.workspace_patch import WorkspacePatchTool


def _tool(root: Path, **kwargs) -> WorkspacePatchTool:
    return WorkspacePatchTool(
        root,
        allowed_paths=("src", "docs"),
        allowed_suffixes=(".py", ".md"),
        **kwargs,
    )


@pytest.mark.asyncio
async def test_workspace_patch_dry_run_returns_diff_without_mutation(tmp_path):
    target = tmp_path / "src" / "hello.py"
    target.parent.mkdir()
    target.write_text("value = 1\n", encoding="utf-8")

    result = await _tool(tmp_path).run(
        path="src/hello.py",
        content="value = 2\n",
        dry_run=True,
    )

    assert target.read_text(encoding="utf-8") == "value = 1\n"
    assert result["changed"] is True
    assert result["applied"] is False
    assert result["audit"]["decision"] == "preview"
    assert "-value = 1" in result["diff"]
    assert "+value = 2" in result["diff"]


@pytest.mark.asyncio
async def test_workspace_patch_atomically_applies_allowlisted_text(tmp_path):
    target = tmp_path / "docs" / "gate.md"
    target.parent.mkdir()
    target.write_text("PARTIAL\n", encoding="utf-8")

    result = await _tool(tmp_path).run(
        path="docs/gate.md",
        content="VERIFIED\n",
        dry_run=False,
    )

    assert target.read_text(encoding="utf-8") == "VERIFIED\n"
    assert result["applied"] is True
    assert result["before_sha256"] != result["after_sha256"]
    assert result["audit"]["decision"] == "applied"


@pytest.mark.asyncio
async def test_workspace_patch_reports_unchanged_without_writing(tmp_path):
    target = tmp_path / "src" / "same.py"
    target.parent.mkdir()
    target.write_text("same\n", encoding="utf-8")

    result = await _tool(tmp_path).run(
        path="src/same.py",
        content="same\n",
        dry_run=False,
    )

    assert result["changed"] is False
    assert result["applied"] is False
    assert result["diff"] == ""


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "path",
    (
        "../outside.py",
        "/etc/passwd",
        ".env",
        "src/.env.local",
        "secrets/key.py",
        "outside/file.py",
        "src/file.exe",
    ),
)
async def test_workspace_patch_rejects_unsafe_or_disallowed_paths(tmp_path, path):
    (tmp_path / "src").mkdir()
    (tmp_path / "docs").mkdir()
    (tmp_path / "outside").mkdir()
    (tmp_path / "src" / "file.exe").write_text("x", encoding="utf-8")
    (tmp_path / "outside" / "file.py").write_text("x", encoding="utf-8")
    (tmp_path / ".env").write_text("TOKEN=nope", encoding="utf-8")
    (tmp_path / "src" / ".env.local").write_text("TOKEN=nope", encoding="utf-8")

    with pytest.raises((ValueError, FileNotFoundError)):
        await _tool(tmp_path).run(path=path, content="changed", dry_run=True)


@pytest.mark.asyncio
async def test_workspace_patch_rejects_symlink_even_inside_workspace(tmp_path):
    target = tmp_path / "src" / "target.py"
    target.parent.mkdir()
    target.write_text("safe\n", encoding="utf-8")
    link = tmp_path / "src" / "link.py"
    try:
        link.symlink_to(target)
    except OSError:
        pytest.skip("symlink creation is unavailable on this platform")

    with pytest.raises(ValueError, match="symlink"):
        await _tool(tmp_path).run(
            path="src/link.py",
            content="changed\n",
            dry_run=False,
        )
    assert target.read_text(encoding="utf-8") == "safe\n"


@pytest.mark.asyncio
async def test_workspace_patch_enforces_content_and_diff_bounds(tmp_path):
    target = tmp_path / "src" / "bounded.py"
    target.parent.mkdir()
    target.write_text("1234", encoding="utf-8")

    with pytest.raises(ValueError, match="new content"):
        await _tool(tmp_path, max_bytes=4).run(
            path="src/bounded.py",
            content="12345",
        )

    with pytest.raises(ValueError, match="diff"):
        await _tool(tmp_path, max_diff_bytes=8).run(
            path="src/bounded.py",
            content="abcd",
        )


def test_workspace_patch_requires_explicit_valid_allowlist(tmp_path):
    with pytest.raises(ValueError, match="at least one allowed path"):
        WorkspacePatchTool(tmp_path, allowed_paths=())

    with pytest.raises(ValueError, match="workspace-relative"):
        WorkspacePatchTool(tmp_path, allowed_paths=("../outside",))
