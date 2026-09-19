# Nightasaur3070 v0.4 — Read-only Runtime Gate A

## Gate contract

Gate A is `VERIFIED` only when all evidence belongs to the same candidate
commit:

1. The AI Engine test suite passes in GitHub Actions.
2. `ReadOnlyExecutionPolicy` denies unknown and mutation-capable tools.
3. `WorkspaceInspectTool` remains bounded to its configured workspace.
4. A Windows 11 host can see the NVIDIA GPU through `nvidia-smi`.
5. Ollama responds locally and contains an explicitly selected, provenance/license-reviewed model.
6. A real read-only AgentCore run completes without modifying the workspace.

CI success alone is not Gate A verification. The Windows 11 / RTX 3070 /
Ollama evidence must be captured from the target laptop after the PR candidate
is fixed.

## Local hardware probe

From PowerShell:

```powershell
cd C:\Nightasaur\apps\ai-engine
python scripts\gate_a_probe.py --model $env:OLLAMA_MODEL | Tee-Object gate-a-result.json
```

Set `OLLAMA_MODEL` only after the review in `docs/MODEL_POLICY.md`.
No model is approved by this change. Prohibited-model evidence is historical only and
cannot serve as the current commercial baseline. Mock tests do not verify
real-model or hardware readiness.

The command only checks environment prerequisites. Success sets
`"environment_ready": true`; `"verified"` remains false. It never certifies
a real AgentCore run, model rights, or matching CI.
Do not commit `gate-a-result.json`; attach it to the review together with the
candidate commit SHA.

## Current boundary

v0.4 supports inspection only. File editing, command execution, Git mutation,
commit/PR creation, deployment, database migration, and service control are
outside Gate A and must remain denied.


## Non-prohibited-model revalidation (2026-09-19)

State model: `UNKNOWN -> ENVIRONMENT_READY -> RUNTIME_SMOKE_PASSED -> GATE_REVIEWED`.
A failed check cannot advance the state. Neither an installed model nor a successful
mock test establishes model provenance or actual hardware execution.

From a clean checkout of the exact candidate, with the AI Engine dependencies installed:

```powershell
$env:PYTHONDONTWRITEBYTECODE = "1"
python apps/ai-engine/scripts/verify_local_runtime.py --commit $CandidateCommit --model $ReviewedModel --digest $ReviewedOllamaDigest
```

Use the complete 40-character commit and the exact `sha256:` digest from the model
review. There is intentionally no default model and no model download. The probe
connects only to loopback Ollama. It requires Windows 11 and an RTX 3070, checks
candidate identity and a clean checkout, creates a disposable synthetic workspace,
and asks the real AgentCore to read a random challenge via `workspace_inspect`.
The answer must match exactly and the successful tool trace must show the read.
The fixture and candidate must remain unchanged. Only the harness creates/removes
the temporary fixture; the Runtime itself is read-only. GPU presence is checked,
not inference GPU utilization or performance. This smoke test does not cover the
separate W3 file/directory classification regression.

Output `runtime_verified` applies only to this smoke test. Top-level `verified`
remains false until the same-commit CI, independent model-source/license review,
and full gate review are attached. Store output outside the checkout; do not
publish model inventories, personal files, machine paths, or credentials.

Current execution blocker: no connected remote execution channel to the owner's
Windows laptop and no reviewed non-prohibited installed model/digest are available
in this session. The owner's authorization is granted; these are missing execution
inputs, not a pending permission request. W1 AI integration remains incomplete.
