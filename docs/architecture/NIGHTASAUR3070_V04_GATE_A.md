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

The owner supplied a real Windows run for candidate
`4bb762f64c1b7fdb607ab05f73a39b1b605cc84d`, generated at
`2026-09-19T16:29:26.563231+00:00`. Windows 11, RTX 3070, the reviewed SmolLM2
package digest, fixture integrity and candidate integrity passed. The real tool
result check failed (`runtime_verified: false`, exit 1). That older report has no
per-call diagnostics, so the exact Windows failure cause is unknown.

The updated runner emits `diagnostics.reason` and bounded per-call flags. These
distinguish unmarked tool JSON, missing/failed tool calls, HTTP/connection/timeouts,
iteration limits, and an inexact final answer. It never emits raw model messages,
tool arguments/results, local paths, or provider error bodies. Timeout/exception
reports retain fixture integrity evidence. The acceptance predicate still needs
an actual successful read and an exact answer. No expected answer is inserted in
the prompt or schema and no canned response, answer repair or quote stripping is
used. Normal JSON decoding preserves the exact value inside the answer field.

The opt-in read-only builder now selects Ollama's JSON-schema response mode.
The protocol accepts exactly one `tool_call` object or one `answer` string;
ambiguous, duplicate-key, legacy bare-call and malformed JSON cannot execute a
tool. The legacy fenced-marker parser remains strict and separate. Plain chat
with an empty tool registry retains its previous request shape.

Because this smoke explicitly requires reading a file, it sets
`require_initial_tool: true`: only the first request requires a tool call. The
model supplies the action/path, AgentCore applies policy and executes the read,
and the model must then produce the final answer from the returned data. This is
a required-tool smoke, not evidence of autonomous tool selection for arbitrary
prompts. The answer schema is an unconstrained string; it contains no challenge
value. The same loopback endpoint is used throughout and ignores ambient proxy
settings in httpx. See [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs)
and [HTTPX environment behavior](https://www.python-httpx.org/environment_variables/).

`external_reviews_not_evaluated` lists checks this local script does not perform.
It does not assert that externally completed CI or provenance reviews are missing.
The release reviewer must attach those records for the tested candidate.

The Windows rerun must use the updated clean candidate. The installed model and
existing Python virtual environment can be reused. There is no connected remote
execution channel to the owner's laptop. W1 AI integration and full Gate review
remain incomplete.


## CPU reproduction evidence (2026-09-19)

A software-only reproduction used Ollama 0.34.0 and the exact SmolLM2 manifest
recorded in `docs/models/SMOLLM2_LOCAL_EVALUATION.md`. The old marker protocol
produced bare call JSON without executing a tool; text-only prompt adjustments
also produced extra final-answer decoration. These observations explain
reproducible software failures, not the unobserved details of the owner's old run.

The final schema-constrained required-tool smoke passed three consecutive fresh
random challenges on CPU, with one successful real read, exact model-provided
answer and unchanged fixture per trial. The bounded evidence record is
`docs/evidence/2026-09-19-smollm2-cpu-runtime.json`; its source hashes identify the
executed files. CPU results do not satisfy the Windows/RTX check or full Gate.
