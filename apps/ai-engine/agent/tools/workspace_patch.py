# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Restricted, auditable text-file mutation for Runtime v0.5."""

from __future__ import annotations

import hashlib
import os
import re
import tempfile
from difflib import unified_diff
from fnmatch import fnmatchcase
from pathlib import Path, PurePosixPath
from typing import Iterable

from agent.tools.base import Tool


class WorkspacePatchTool(Tool):
    """Replace one existing UTF-8 text file inside an explicit allowlist.

    The tool fails closed for absolute/traversal paths, symlinks, denylisted
    paths, disallowed suffixes, oversized content/diffs, stale source hashes,
    and paths outside the configured workspace. Every successful dry-run or
    write returns hashes and a bounded audit trace.
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
            "expected_sha256": {"type": "string"},
        },
        "required": ["path", "content"],
    }

    _DEFAULT_DENY_PATHS = (
        ".git",
        ".git/**",
        ".env",
        ".env.*",
        "**/.env",
        "**/.env.*",
        "**/credentials/**",
        "**/secrets/**",
        "**/private_keys/**",
        "**/*.key",
        "**/*.pem",
    )
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
        denied_paths: Iterable[str] | None = None,
        allowed_suffixes: Iterable[str] | None = None,
        max_bytes: int = 65_536,
        max_diff_bytes: int = 131_072,
        max_changed_lines: int = 400,
    ):
        self.root = Path(root).resolve(strict=True)
        if not self.root.is_dir():
            raise ValueError("workspace root must be a directory")
        if max_bytes < 1 or max_diff_bytes < 1 or max_changed_lines < 1:
            raise ValueError("patch bounds must be positive")

        normalized_paths = [
            self._normalize_relative(str(raw_path), label="allowed path")
            for raw_path in allowed_paths
        ]
        if not normalized_paths:
            raise ValueError("at least one allowed path is required")

        deny_patterns = tuple(denied_paths or self._DEFAULT_DENY_PATHS)
        if any(not isinstance(pattern, str) or not pattern.strip() for pattern in deny_patterns):
            raise ValueError("denied paths must be non-empty glob patterns")

        suffixes = {
            suffix.lower() if suffix.startswith(".") else f".{suffix.lower()}"
            for suffix in (allowed_suffixes or self._DEFAULT_SUFFIXES)
        }
        if not suffixes:
            raise ValueError("at least one allowed suffix is required")

        self.allowed_paths = tuple(normalized_paths)
        self.denied_paths = deny_patterns
        self.allowed_suffixes = frozenset(suffixes)
        self.max_bytes = max_bytes
        self.max_diff_bytes = max_diff_bytes
        self.max_changed_lines = max_changed_lines

    @staticmethod
    def _digest(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def _normalize_relative(raw_path: str, *, label: str = "path") -> Path:
        if not isinstance(raw_path, str) or not raw_path.strip():
            raise ValueError(f"{label} must be a non-empty relative string")
        portable = raw_path.strip().replace("\\", "/")
        if portable.startswith(("/", "//")) or re.match(r"^[A-Za-z]:", portable):
            raise ValueError(f"{label} must be workspace-relative")
        parts = PurePosixPath(portable).parts
        if ".." in parts:
            raise ValueError(f"{label} must be workspace-relative")
        return Path(*parts)

    @staticmethod
    def _matches(path: str, pattern: str) -> bool:
        normalized_pattern = pattern.replace("\\", "/")
        return fnmatchcase(path, normalized_pattern) or (
            normalized_pattern.startswith("**/")
            and fnmatchcase(path, normalized_pattern[3:])
        )

    def _resolve(self, raw_path: str) -> tuple[Path, Path, str]:
        relative = self._normalize_relative(raw_path)
        portable = relative.as_posix()
        denied_match = next(
            (pattern for pattern in self.denied_paths if self._matches(portable, pattern)),
            None,
        )
        if denied_match is not None:
            raise ValueError(f"path is denied by write policy: {denied_match}")

        cursor = self.root
        for part in relative.parts:
            cursor = cursor / part
            if cursor.is_symlink():
                raise ValueError("symlink paths are not writable")

        target = (self.root / relative).resolve(strict=True)
        try:
            normalized = target.relative_to(self.root)
        except ValueError as exc:
            raise ValueError("path escapes the workspace root") from exc

        allowed_match = next(
            (
                allowed.as_posix()
                for allowed in self.allowed_paths
                if normalized == allowed or allowed in normalized.parents
            ),
            None,
        )
        if allowed_match is None:
            raise ValueError("path is outside the write allowlist")
        if target.suffix.lower() not in self.allowed_suffixes:
            raise ValueError("file suffix is not writable")
        if not target.is_file():
            raise ValueError("workspace_patch requires an existing file")

        return target, normalized, allowed_match

    async def run(self, **kwargs):
        target, relative, allowed_match = self._resolve(kwargs.get("path"))
        content = kwargs.get("content")
        dry_run = kwargs.get("dry_run", True)
        expected_sha256 = kwargs.get("expected_sha256")

        if not isinstance(content, str):
            raise ValueError("content must be a UTF-8 string")
        if not isinstance(dry_run, bool):
            raise ValueError("dry_run must be a boolean")
        if expected_sha256 is not None and (
            not isinstance(expected_sha256, str)
            or re.fullmatch(r"[0-9a-fA-F]{64}", expected_sha256) is None
        ):
            raise ValueError("expected_sha256 must be a 64-character hex digest")

        before = target.read_bytes()
        if len(before) > self.max_bytes:
            raise ValueError(f"existing file exceeds limit of {self.max_bytes} bytes")
        if b"\x00" in before:
            raise ValueError("binary files are not writable")
        try:
            before_text = before.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError("existing file is not valid UTF-8 text") from exc

        before_sha = self._digest(before)
        if expected_sha256 is not None and expected_sha256.lower() != before_sha:
            raise ValueError("existing file hash does not match expected_sha256")

        after = content.encode("utf-8")
        if len(after) > self.max_bytes:
            raise ValueError(f"new content exceeds limit of {self.max_bytes} bytes")

        diff_lines = list(
            unified_diff(
                before_text.splitlines(keepends=True),
                content.splitlines(keepends=True),
                fromfile=f"before/{relative.as_posix()}",
                tofile=f"after/{relative.as_posix()}",
            )
        )
        diff = "".join(diff_lines)
        diff_bytes = len(diff.encode("utf-8"))
        changed_lines = sum(
            1
            for line in diff_lines
            if (line.startswith("+") or line.startswith("-"))
            and not line.startswith(("+++", "---"))
        )
        if diff_bytes > self.max_diff_bytes:
            raise ValueError(f"diff exceeds limit of {self.max_diff_bytes} bytes")
        if changed_lines > self.max_changed_lines:
            raise ValueError(
                f"diff exceeds changed-line limit of {self.max_changed_lines}"
            )

        after_sha = self._digest(after)
        changed = before != after
        applied = False

        if changed and not dry_run:
            if target.read_bytes() != before:
                raise ValueError("existing file changed during patch preparation")
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

        decision = "no_change" if not changed else "preview" if dry_run else "applied"
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
                "decision": decision,
                "trace_id": f"{before_sha[:12]}:{after_sha[:12]}",
                "allowlist_match": allowed_match,
                "bounds": {
                    "max_bytes": self.max_bytes,
                    "max_diff_bytes": self.max_diff_bytes,
                    "max_changed_lines": self.max_changed_lines,
                    "diff_bytes": diff_bytes,
                    "changed_lines": changed_lines,
                },
            },
        }
