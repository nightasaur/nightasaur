# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Bounded, workspace-scoped inspection tool for Runtime v0.4."""

from __future__ import annotations

from pathlib import Path

from agent.tools.base import Tool


class WorkspaceInspectTool(Tool):
    """Read metadata, directory entries, or UTF-8 text below one root.

    The tool cannot write. Absolute paths, traversal, symlink escapes,
    sensitive paths, binary files, and unbounded reads are rejected.
    """

    name = "workspace_inspect"
    description = "Inspect a bounded path inside the configured workspace."
    read_only = True
    parameters = {
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": ["stat", "list", "read"]},
            "path": {"type": "string"},
        },
        "required": ["action", "path"],
    }

    _SENSITIVE_PARTS = {
        ".git",
        ".env",
        ".netrc",
        ".npmrc",
        ".pypirc",
        "credentials",
        "id_ed25519",
        "id_rsa",
        "secrets",
        "private_keys",
    }

    def __init__(self, root: str | Path, *, max_bytes: int = 65_536, max_entries: int = 200):
        self.root = Path(root).resolve(strict=True)
        if not self.root.is_dir():
            raise ValueError("workspace root must be a directory")
        if max_bytes < 1 or max_entries < 1:
            raise ValueError("inspection bounds must be positive")
        self.max_bytes = max_bytes
        self.max_entries = max_entries

    def _resolve(self, raw_path: str) -> Path:
        if not isinstance(raw_path, str) or not raw_path.strip():
            raise ValueError("path must be a non-empty relative string")
        relative = Path(raw_path)
        if relative.is_absolute():
            raise ValueError("absolute paths are not allowed")
        if any(self._is_sensitive(part) for part in relative.parts):
            raise ValueError("sensitive paths are not inspectable")
        candidate = self.root
        for part in relative.parts:
            candidate = candidate / part
            if candidate.is_symlink():
                raise ValueError("symbolic links are not inspectable")
        target = candidate.resolve(strict=True)
        try:
            resolved_relative = target.relative_to(self.root)
        except ValueError as exc:
            raise ValueError("path escapes the workspace root") from exc
        if any(self._is_sensitive(part) for part in resolved_relative.parts):
            raise ValueError("sensitive paths are not inspectable")
        return target

    @classmethod
    def _is_sensitive(cls, part: str) -> bool:
        lowered = part.lower()
        return lowered in cls._SENSITIVE_PARTS or lowered.startswith(".env.")

    async def run(self, **kwargs):
        action = kwargs.get("action")
        target = self._resolve(kwargs.get("path"))

        if action == "stat":
            return {
                "path": target.relative_to(self.root).as_posix(),
                "kind": "directory" if target.is_dir() else "file",
                "size": target.stat().st_size,
            }

        if action == "list":
            if not target.is_dir():
                raise ValueError("list requires a directory")
            entries = sorted(target.iterdir(), key=lambda item: item.name.lower())
            truncated = len(entries) > self.max_entries
            return {
                "path": target.relative_to(self.root).as_posix(),
                "entries": [
                    {
                        "name": item.name,
                        "kind": "directory" if item.is_dir() else "file",
                    }
                    for item in entries[: self.max_entries]
                    if not self._is_sensitive(item.name) and not item.is_symlink()
                ],
                "truncated": truncated,
            }

        if action == "read":
            if not target.is_file():
                raise ValueError("read requires a file")
            size = target.stat().st_size
            if size > self.max_bytes:
                raise ValueError(f"file exceeds read limit of {self.max_bytes} bytes")
            data = target.read_bytes()
            if b"\x00" in data:
                raise ValueError("binary files are not inspectable")
            try:
                content = data.decode("utf-8")
            except UnicodeDecodeError as exc:
                raise ValueError("file is not valid UTF-8 text") from exc
            return {
                "path": target.relative_to(self.root).as_posix(),
                "content": content,
                "size": size,
            }

        raise ValueError("action must be one of: stat, list, read")
