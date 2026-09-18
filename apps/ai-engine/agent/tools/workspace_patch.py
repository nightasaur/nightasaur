# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Restricted, auditable text-file mutation for Runtime v0.5."""

from __future__ import annotations

import hashlib
import os
import tempfile
from difflib import unified_diff
from pathlib import Path
from typing import Iterable

from agent.tools.base import Tool


class WorkspacePatchTool(Tool):
    """Replace one existing UTF-8 text file inside an explicit allowlist.

    The tool fails closed for absolute/traversal paths, symlinks, sensitive
    names, disallowed suffixes, oversized content/diffs, and paths outside the
    configured workspace. Every successful dry-run or write returns hashes and
    a bounded unified diff suitable for an audit trace.
    """

    name = "workspace_patch"
    description = "Dry-run or atomically replace an allowlisted workspace text file."
    read_only = False
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string"},
            "content": {"type": "string"},
            "dry_run": {"type": "boolean", "default": True},
        },
        "required": ["path", "content"],
    }

    _SENSITIVE_PARTS = {
        ".git",
        "credentials",
        "secrets",
        "private_keys",
    }
    _DEFAULT_SUFFIXES = {
        ".json",
        ".md",
        ".py",
        ".toml",
        ".ts",
        ".tsx",
        ".yaml",
        ".yml",
    }

    def __init__(
        self,
        root: str | Path,
        *,
        allowed_paths: Iterable[str | Path],
        allowed_suffixes: Iterable[str] | None = None,
        max_bytes: int = 65_536,
        max_diff_bytes: int = 131_072,
    ):
        self.root = Path(root).resolve(strict=True)
        if not self.root.is_dir():
            raise ValueError("workspace root must be a directory")
        if max_bytes < 1 or max_diff_bytes < 1:
            raise ValueError("patch bounds must be positive")

        normalized_paths = []
        for raw_path in allowed_paths:
            candidate = Path(raw_path)
            if candidate.is_absolute() or ".." in candidate.parts:
                raise ValueError("allowed paths must be workspace-relative")
            normalized_paths.append(candidate)
        if not normalized_paths:
            raise ValueError("at least one allowed path is required")

        suffixes = {
            suffix.lower() if suffix.startswith(".") else f".{suffix.lower()}"
            for suffix in (allowed_suffixes or self._DEFAULT_SUFFIXES)
        }
        if not suffixes:
            raise ValueError("at least one allowed suffix is required")

        self.allowed_paths = tuple(normalized_paths)
        self.allowed_suffixes = frozenset(suffixes)
        self.max_bytes = max_bytes
        self.max_diff_bytes = max_diff_bytes

    @staticmethod
    def _digest(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    @classmethod
    def _is_sensitive_part(cls, part: str) -> bool:
        lowered = part.lower()
        return (
            lowered in cls._SENSITIVE_PARTS
            or lowered == ".env"
            or lowered.startswith(".env.")
        )

    def _resolve(self, raw_path: str) -> tuple[Path, Path]:
        if not isinstance(raw_path, str) or not raw_path.strip():
            raise ValueError("path must be a non-empty relative string")

        relative = Path(raw_path)
        if relative.is_absolute():
            raise ValueError("absolute paths are not allowed")
        if ".." in relative.parts:
            raise ValueError("path traversal is not allowed")
        if any(self._is_sensitive_part(part) for part in relative.parts):
            raise ValueError("sensitive paths are not writable")

        unresolved = self.root / relative
        cursor = self.root
        for part in relative.parts:
            cursor = cursor / part
            if cursor.is_symlink():
                raise ValueError("symlink paths are not writable")

        target = unresolved.resolve(strict=True)
        try:
            normalized = target.relative_to(self.root)
        except ValueError as exc:
            raise ValueError("path escapes the workspace root") from exc

        if not any(
            normalized == allowed or allowed in normalized.parents
            for allowed in self.allowed_paths
        ):
            raise ValueError("path is outside the write allowlist")
        if target.suffix.lower() not in self.allowed_suffixes:
            raise ValueError("file suffix is not writable")
        if not target.is_file():
            raise ValueError("workspace_patch requires an existing file")

        return target, normalized

    async def run(self, **kwargs):
        target, relative = self._resolve(kwargs.get("path"))
        content = kwargs.get("content")
        dry_run = kwargs.get("dry_run", True)

        if not isinstance(content, str):
            raise ValueError("content must be a UTF-8 string")
        if not isinstance(dry_run, bool):
            raise ValueError("dry_run must be a boolean")

        before = target.read_bytes()
        if len(before) > self.max_bytes:
            raise ValueError(f"existing file exceeds limit of {self.max_bytes} bytes")
        if b"\x00" in before:
            raise ValueError("binary files are not writable")
        try:
            before_text = before.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError("existing file is not valid UTF-8 text") from exc

        after = content.encode("utf-8")
        if len(after) > self.max_bytes:
            raise ValueError(f"new content exceeds limit of {self.max_bytes} bytes")

        diff = "".join(
            unified_diff(
                before_text.splitlines(keepends=True),
                content.splitlines(keepends=True),
                fromfile=f"before/{relative.as_posix()}",
                tofile=f"after/{relative.as_posix()}",
            )
        )
        if len(diff.encode("utf-8")) > self.max_diff_bytes:
            raise ValueError(f"diff exceeds limit of {self.max_diff_bytes} bytes")

        before_sha = self._digest(before)
        after_sha = self._digest(after)
        changed = before != after
        applied = False

        if changed and not dry_run:
            descriptor, temporary_name = tempfile.mkstemp(
                prefix=f".{target.name}.",
                suffix=".tmp",
                dir=target.parent,
            )
            try:
                with os.fdopen(descriptor, "wb") as handle:
                    handle.write(after)
                    handle.flush()
                    os.fsync(handle.fileno())
                os.chmod(temporary_name, target.stat().st_mode)
                os.replace(temporary_name, target)
                applied = True
            finally:
                if os.path.exists(temporary_name):
                    os.unlink(temporary_name)

        return {
            "path": relative.as_posix(),
            "dry_run": dry_run,
            "changed": changed,
            "applied": applied,
            "before_sha256": before_sha,
            "after_sha256": after_sha,
            "diff": diff,
            "audit": {
                "tool": self.name,
                "path": relative.as_posix(),
                "decision": "preview" if dry_run else "applied",
                "trace_id": f"{before_sha[:12]}:{after_sha[:12]}",
                "bounds": {
                    "max_bytes": self.max_bytes,
                    "max_diff_bytes": self.max_diff_bytes,
                },
            },
        }
