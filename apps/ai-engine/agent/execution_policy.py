# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""ExecutionPolicy —— 工具執行前的最小 policy boundary。

AgentCore 在看到模型的 tool call 請求後，不應該無條件呼叫
ToolRegistry.execute()。每一次工具呼叫都必須先經過 ExecutionPolicy.evaluate()
決定 allow / deny / confirmation_required。

v0.2 預設實作 AllowAllExecutionPolicy 全部放行，行為等同「一律執行」，不做
任何 permission UI 或 human-in-the-loop 流程 —— 但這個邊界必須存在，才能在
未來掛上高風險工具、side-effect 工具、企業政策、人工核可流程時，不需要更動
AgentCore 的 loop 邏輯。
"""
import hashlib
import hmac
import re
from abc import ABC, abstractmethod
from collections.abc import Iterable
from dataclasses import dataclass
from enum import Enum
from pathlib import PurePosixPath

from agent.tool_calls import ToolCallRequest, ToolSpec


class ExecutionDecision(Enum):
    """ExecutionPolicy.evaluate() 的三種可能結果。"""

    ALLOW = "allow"
    DENY = "deny"
    CONFIRMATION_REQUIRED = "confirmation_required"


class ExecutionPolicy(ABC):
    """所有工具執行政策都必須實作此介面。"""

    @abstractmethod
    def evaluate(
        self,
        tool_call: ToolCallRequest,
        tool_spec: ToolSpec | None,
        context: dict,
    ) -> ExecutionDecision:
        """決定是否允許執行這次工具呼叫。

        - tool_spec 可能為 None（例如模型要求了一個未註冊的工具）。
        - context 保留給未來擴充（例如 session 資訊、使用者角色、風險等級），
          v0.2 不對其內容做任何假設。
        """
        raise NotImplementedError


class AllowAllExecutionPolicy(ExecutionPolicy):
    """v0.2 預設政策：全部放行，行為等同沒有 policy 邊界前的「一律執行」。"""

    def evaluate(
        self,
        tool_call: ToolCallRequest,
        tool_spec: ToolSpec | None,
        context: dict,
    ) -> ExecutionDecision:
        return ExecutionDecision.ALLOW


class ReadOnlyExecutionPolicy(ExecutionPolicy):
    """v0.4 fail-closed policy for an inspect-only runtime.

    A model-provided tool name is never trusted by itself. The matching
    registry specification must exist and must explicitly declare
    ``read_only=True``. Unknown, legacy, and mutation-capable tools are
    denied without invoking their implementation.
    """

    def evaluate(
        self,
        tool_call: ToolCallRequest,
        tool_spec: ToolSpec | None,
        context: dict,
    ) -> ExecutionDecision:
        if tool_spec is None or tool_spec.name != tool_call.name:
            return ExecutionDecision.DENY
        return (
            ExecutionDecision.ALLOW
            if tool_spec.read_only is True
            else ExecutionDecision.DENY
        )


_SHA256_PATTERN = re.compile(r"^[0-9a-fA-F]{64}$")


def _normalize_workspace_path(raw_path: object) -> str | None:
    """Return a portable relative path for policy comparison.

    The policy must not rely on the host operating system when comparing an
    approval with model-provided arguments.  Windows separators are therefore
    normalized before absolute paths and traversal are rejected.
    """

    if not isinstance(raw_path, str) or not raw_path.strip():
        return None
    portable = raw_path.strip().replace("\\", "/")
    if portable.startswith(("/", "//")) or re.match(r"^[A-Za-z]:", portable):
        return None
    parts = PurePosixPath(portable).parts
    if not parts or ".." in parts:
        return None
    return "/".join(parts)


class CodingExecutionPolicy(ExecutionPolicy):
    """Fail-closed policy for the opt-in v0.6 coding Tool Loop.

    Read-only tools and ``workspace_patch`` previews are allowed.  Applying a
    patch requires a constructor-provided approval that binds one normalized
    path to the exact before and after SHA-256 hashes. Runtime metadata is
    intentionally not accepted as approval because it is descriptive,
    untrusted input rather than an authorization credential.
    """

    def __init__(
        self, approved_writes: Iterable["WorkspaceWriteApproval"] | None = None
    ):
        normalized: dict[str, tuple[str, str]] = {}
        for approval in approved_writes or ():
            if not isinstance(approval, WorkspaceWriteApproval):
                raise TypeError("approved writes must be WorkspaceWriteApproval values")
            path = _normalize_workspace_path(approval.path)
            if path is None:
                raise ValueError("approved write paths must be workspace-relative")
            digests = (approval.before_sha256, approval.after_sha256)
            if any(
                not isinstance(digest, str)
                or _SHA256_PATTERN.fullmatch(digest) is None
                for digest in digests
            ):
                raise ValueError("approved write hashes must be SHA-256 hex digests")
            hashes = (digests[0].lower(), digests[1].lower())
            if path in normalized and normalized[path] != hashes:
                raise ValueError("conflicting approvals normalize to the same path")
            normalized[path] = hashes
        self._approved_writes = normalized

    def evaluate(
        self,
        tool_call: ToolCallRequest,
        tool_spec: ToolSpec | None,
        context: dict,
    ) -> ExecutionDecision:
        if tool_spec is None or tool_spec.name != tool_call.name:
            return ExecutionDecision.DENY
        if tool_spec.read_only is True:
            return ExecutionDecision.ALLOW
        if tool_spec.name != "workspace_patch":
            return ExecutionDecision.DENY
        if not isinstance(tool_call.arguments, dict):
            return ExecutionDecision.DENY

        dry_run = tool_call.arguments.get("dry_run", True)
        if dry_run is True:
            return ExecutionDecision.ALLOW
        if dry_run is not False:
            return ExecutionDecision.DENY

        path = _normalize_workspace_path(tool_call.arguments.get("path"))
        expected_sha256 = tool_call.arguments.get("expected_sha256")
        content = tool_call.arguments.get("content")
        if (
            path is None
            or not isinstance(expected_sha256, str)
            or _SHA256_PATTERN.fullmatch(expected_sha256) is None
            or not isinstance(content, str)
        ):
            return ExecutionDecision.DENY

        approved_hashes = self._approved_writes.get(path)
        requested_after_sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()
        if approved_hashes is None or not (
            hmac.compare_digest(approved_hashes[0], expected_sha256.lower())
            and hmac.compare_digest(approved_hashes[1], requested_after_sha256)
        ):
            return ExecutionDecision.CONFIRMATION_REQUIRED
        return ExecutionDecision.ALLOW


@dataclass(frozen=True)
class WorkspaceWriteApproval:
    """Trusted approval for one exact workspace text replacement."""

    path: str
    before_sha256: str
    after_sha256: str
