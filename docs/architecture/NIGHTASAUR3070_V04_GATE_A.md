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

The command is read-only. A successful result ends with `"verified": true`.
Do not commit `gate-a-result.json`; attach it to the review together with the
candidate commit SHA.

## Current boundary

v0.4 supports inspection only. File editing, command execution, Git mutation,
commit/PR creation, deployment, database migration, and service control are
outside Gate A and must remain denied.
