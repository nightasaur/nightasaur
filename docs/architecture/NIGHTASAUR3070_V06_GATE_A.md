# Nightasaur3070 v0.6 — Bounded Coding Tool Loop Gate A

## Gate contract

W5 Gate A is `VERIFIED` only when all evidence belongs to the same candidate
commit and the candidate remains stacked on the verified W4 branch:

1. The complete AI Engine test suite passes.
2. The existing default Runtime（執行環境）and read-only Runtime remain unchanged.
3. The coding Runtime is opt-in and registers only `workspace_inspect` and
   `workspace_patch`.
4. Read-only calls and `workspace_patch` previews are allowed.
5. A non-dry-run patch requires an explicit approval binding one normalized
   workspace path to both the exact current-file SHA-256 sent as
   `expected_sha256` and the exact approved replacement-content SHA-256.
6. Missing, malformed, stale, path-mismatched, or hash-mismatched approvals do
   not execute the tool.
7. Unknown tools and all other mutation-capable tools fail closed.
8. A full scripted AgentCore Tool Loop（工具循環）proves inspect → preview → final
   response without mutation, plus exact-approved apply and unapproved denial
   in temporary workspaces.

CI success alone does not authorize a merge, Production（正式環境）deployment,
Production database access, shell execution, Git mutation, or registration in
the default live Runtime.

## Focused verification

```bash
cd apps/ai-engine
python -m pytest -q tests/test_coding_tool_loop.py
python -m pytest -q
```

## Approval model

`CodingExecutionPolicy` accepts `WorkspaceWriteApproval` values only through
trusted constructor input. Each approval binds a workspace-relative path,
current content SHA-256, and approved replacement content SHA-256. Runtime
metadata is descriptive and untrusted, so it can never grant write permission.
After one successful replacement, the source hash changes and the same approval
cannot apply again.

## Current boundary

v0.6 covers inspection, bounded dry-run previews, and exact preapproved
replacement of existing UTF-8 text files. File creation/deletion, arbitrary
commands, Git operations, deployment controls, database migration, and
Production Runtime registration remain denied.
