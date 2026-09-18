# Nightasaur3070 v0.5 — Restricted Workspace Mutation Gate

## Gate contract

W4 Gate A is `VERIFIED` only when all evidence belongs to the same candidate
commit and the candidate remains stacked on the verified PR #18 head:

1. The full AI Engine test suite passes in GitHub Actions.
2. `workspace_patch` defaults to `dry_run=true`.
3. The write allowlist is explicit and a matching denylist always takes precedence.
4. Absolute paths, POSIX/Windows traversal, symlinks, sensitive paths, disallowed
   suffixes, and workspace escapes are rejected.
5. Existing/new file size, unified-diff bytes, and changed-line counts remain
   within configured limits.
6. A non-dry-run write requires an existing UTF-8 text file, is atomic, and may
   be guarded by `expected_sha256` to reject stale edits.
7. The result exposes no whole-file copy and records a deterministic audit trace
   containing the decision, matched allowlist boundary, hashes, and enforced
   limits.
8. The tool is not registered into the default or read-only Production runtime.

CI success alone does not authorize a merge, Production deployment, Production
database access, or unrestricted command execution.

## Isolated verification

The focused safety suite is:

```bash
cd apps/ai-engine
python -m pytest -q tests/test_workspace_patch.py
```

Then run the complete relevant gate:

```bash
cd apps/ai-engine
python -m pytest -q
```

A safe manual smoke test must use a temporary workspace, first prove dry-run
leaves the file unchanged, then apply one allowlisted change using the
`before_sha256` returned by the dry-run. The temporary workspace must not be a
Production checkout.

## Current boundary

v0.5 Gate A covers bounded replacement of existing text files only. File
creation/deletion, arbitrary shell commands, Git mutation, deployment controls,
database migration, and Production runtime registration remain denied.
