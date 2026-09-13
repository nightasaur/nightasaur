# ADR-0001: Runtime, Device, Identity, and Capability Model for Agent Core v0.3

- Status: Proposed (architecture decision record; no code has been written
  against this ADR yet)
- Date: 2026-09-13
- Supersedes: none
- Related: [`AGENT_RUNTIME_VISION.md`](./AGENT_RUNTIME_VISION.md)

## Context

Agent Core v0.1 established `AgentCore` as the orchestration entry point,
backed by a swappable `ModelProvider`, a `ToolRegistry`, and a
`MemoryProvider`. Agent Core v0.2 added a provider-neutral tool-calling
execution loop with an `ExecutionPolicy` boundary
(`allow` / `deny` / `confirmation_required`), a JSON-safe tool result
serialization boundary, and a bounded/redacted `tool_trace` for
diagnostics. Both versions are implemented in `apps/ai-engine/agent/` and
are merged to `main`.

Neither version has any concept of *where* the Agent is running (which
physical/logical device), *what that device can do*, or *who the Agent
persistently is* independent of the current model/device/provider wiring.
As the runtime grows toward the vision in `AGENT_RUNTIME_VISION.md` (an open,
device-first runtime supporting a baseline level of participation in a
larger Agent World), these concepts need names, minimal shapes, and a clear
integration point — without prematurely committing to networking, identity
persistence, or Cloud infrastructure.

This ADR scopes exactly what is decided for the next implementation phase
(v0.3) and explicitly defers everything else.

## Decision

Introduce four new, minimal, dependency-free data structures and one
integration rule for `AgentCore`. All four structures are **optional**
inputs; their absence must reproduce v0.2 behavior exactly.

### 1. `RuntimeContext`

The top-level container describing the runtime environment a given
`AgentCore.run()` call executes in.

```python
@dataclass
class RuntimeContext:
    runtime_id: str
    device: Optional["DeviceContext"] = None
    provider: Optional["ProviderContext"] = None
    metadata: dict = field(default_factory=dict)
```

- `runtime_id` is an opaque, caller-assigned identifier (e.g. a process or
  host identifier). The runtime does not interpret its format.
- `device` and `provider` are optional sub-contexts (below); a
  `RuntimeContext` with both `None` is legal and represents "no
  device/provider information available" rather than an error.
- `metadata` is an open, forward-compatible escape hatch for fields not yet
  worth promoting to a first-class attribute.

### 2. `DeviceContext`

Descriptive information about the device an Agent is currently associated
with. **Descriptive only** — per the `Device capability != Agent
permission` invariant, this structure never grants permission by itself.

```python
@dataclass
class DeviceContext:
    device_id: str
    capabilities: list["Capability"] = field(default_factory=list)
    online: bool = True
    metadata: dict = field(default_factory=dict)
```

- `capabilities` is a list of declarative `Capability` values (below), not
  booleans directly on this class, so new capabilities can be added without
  changing `DeviceContext`'s shape.
- `online` is a simple, common-enough fact to warrant a first-class field;
  everything else device-specific goes in `metadata` until it earns
  promotion.

### 3. `Capability`

A single declarative statement of something a device, tool, or provider can
do.

```python
@dataclass
class Capability:
    name: str
    value: Any = True
    source: str = "device"  # e.g. "device" | "tool" | "provider"
```

- `name` is a namespaced string (e.g. `"input.microphone"`,
  `"tool.native_calling"`, `"provider.streaming"`) so capability names don't
  collide across sources.
- `value` defaults to `True` (presence/absence) but allows richer values
  (e.g. a version number or quality tier) without inventing a new type per
  capability.
- Capabilities are pure data. Nothing in `AgentCore` interprets a specific
  capability name in v0.3 — interpretation is entirely `ExecutionPolicy`'s
  responsibility (or future policy implementations'), consistent with
  `AgentCore` staying orchestration-only.

### 4. `AgentIdentity`

The stable identity of an Agent, independent of the model/device/provider
currently serving it.

```python
@dataclass
class AgentIdentity:
    agent_id: str
    display_name: Optional[str] = None
    metadata: dict = field(default_factory=dict)
```

- v0.3 scope is intentionally minimal: an opaque `agent_id` plus a display
  name and metadata bag. It is a value object passed through the run, not a
  persisted/queryable record — persistence is explicitly out of scope
  (Non-Goals, below).
- `AgentCore` treats `AgentIdentity` as opaque data to thread through to
  `ExecutionPolicy` and (optionally) `MemoryProvider`; it does not validate,
  store, or look up identities itself.

### 5. `ProviderContext` (minimal)

A minimal, informational description of which concrete providers are wired
up for a given run.

```python
@dataclass
class ProviderContext:
    model_provider_name: str
    supports_native_tool_calls: bool = False
    metadata: dict = field(default_factory=dict)
```

- This deliberately mirrors information `ModelProvider` can already report
  (`supports_native_tool_calls()`), packaged for context propagation rather
  than adding new provider behavior.
- v0.3 scope is model-provider-only; memory/compute/storage provider
  description is deferred (Non-Goals).

### 6. `AgentCore` integration rule

`AgentInput` gains one new optional field:

```python
@dataclass
class AgentInput:
    ...  # all existing v0.2 fields unchanged
    runtime_context: Optional[RuntimeContext] = None
```

`AgentCore.run()`'s integration rule is:

- If `agent_input.runtime_context` is `None` (the default, and the only
  value any existing caller — `services/llm.py`, `services/assistant_llm.py`,
  and all v0.1/v0.2 tests — will ever pass), the run behaves **exactly** as
  in v0.2: no new object is constructed, no new field is populated, no new
  branch is taken that produces different output than today.
- If `runtime_context` is provided, `AgentCore._safe_evaluate_policy()`
  includes it in the `context` dict already passed to
  `ExecutionPolicy.evaluate(tool_call, tool_spec, context)` — e.g.
  `context["runtime"] = runtime_context` — rather than changing
  `ExecutionPolicy`'s method signature. `ExecutionPolicy.evaluate()`'s third
  parameter is already a plain `dict` in v0.2 specifically to allow this
  kind of additive extension without a breaking interface change (see
  Feasibility Review, item 5, in the Slack report accompanying this ADR).
- `AgentCore` never reads `Capability` values itself and never branches on
  `DeviceContext`/`ProviderContext` content. It only threads
  `RuntimeContext` through to the policy boundary (and, optionally, into
  `tool_trace`/`metadata` for diagnostics, following the same
  serialization/redaction discipline established in v0.2). All
  interpretation of runtime/device/capability data for allow/deny decisions
  belongs to `ExecutionPolicy` implementations, not to `AgentCore`.

### Backward compatibility rules

1. No existing public method signature in `agent/core.py`, `agent/schemas.py`,
   `agent/execution_policy.py`, `agent/providers/base.py`,
   `agent/tools/registry.py`, or `agent/memory/base.py` is changed in a
   breaking way. `runtime_context` is additive and optional everywhere it
   appears.
2. `AllowAllExecutionPolicy.evaluate()` ignores the new `context["runtime"]`
   key exactly as it already ignores every other context key today — no
   change to its behavior is required or expected.
3. `services/llm.py` and `services/assistant_llm.py` continue to construct
   `AgentInput` without `runtime_context` and continue to read only
   `output.content`; this ADR requires zero changes to either file.
4. `/dialogue` and `/assistant` HTTP contracts are unaffected: this is an
   internal orchestration-layer change only.
5. All v0.1 and v0.2 tests must continue to pass unmodified, since
   `runtime_context=None` is the default and produces identical behavior.

## Non-Goals (explicitly out of scope for this ADR and for v0.3)

- Physical device drivers (camera, microphone, sensors, etc.)
- GPU scheduling or any compute-resource scheduling
- Distributed execution across multiple hosts/processes
- Agent-to-Agent or Device-to-Device networking/protocols
- Nightasaur Cloud product/billing integration
- Persistent identity storage (database-backed `AgentIdentity` lookup,
  issuance, or revocation) — v0.3's `AgentIdentity` is a transient value
  object only
- Authentication/authorization UI of any kind
- Vector memory or any new `MemoryProvider` backend
- Frontend or mobile changes of any kind
- ComfyUI or image-generation changes of any kind
- Any change to `ExecutionPolicy`'s method signature (context propagation
  uses the existing `dict` parameter; a signature change is deferred until
  there's a concrete implementation that needs one)

## Consequences

- Adding `RuntimeContext`/`DeviceContext`/`Capability`/`AgentIdentity`/
  `ProviderContext` as new, independent modules (analogous to
  `agent/tool_calls.py`) keeps them decoupled from `AgentCore` internals and
  easy to review/test in isolation.
- Because integration is a single optional field on `AgentInput` plus one
  additive key in an already-`dict`-typed policy context parameter, v0.3
  implementation risk is low and does not require touching the tool-calling
  loop's control flow at all.
- Deferring persistence, networking, and Cloud integration keeps this ADR's
  decision surface small enough to implement and test in one focused PR,
  consistent with how v0.1 and v0.2 were each scoped and delivered.
- Because no existing interface changes shape, this decision can be
  implemented, reviewed, and reverted independently of any other in-flight
  work, with the same low-risk rollback profile as v0.1/v0.2 (revert the
  commit/PR; `main` is unaffected until merge).

## Alternatives considered

- **Changing `ExecutionPolicy.evaluate()`'s signature to accept a typed
  `RuntimeContext` parameter directly**, instead of threading it through the
  existing `context: dict`. Rejected for v0.3: it would force every existing
  `ExecutionPolicy` implementation (including test doubles in
  `tests/test_agent_core_tool_loop.py` and `tests/test_execution_policy.py`)
  to update their method signature immediately, which is a breaking change
  for no immediate behavioral benefit. The existing `dict` parameter already
  supports additive evolution; a typed signature can be introduced later,
  behind a deprecation path, once a concrete `ExecutionPolicy` actually needs
  strongly-typed access.
- **Making `AgentIdentity` a persisted, queryable entity in v0.3.** Rejected:
  persistence implies a storage backend decision (SQL? key-value? which
  `MemoryProvider`?) that is explicitly out of scope and better made once
  there is a concrete consumer requiring lookup/durability, not speculatively
  now.
- **Deriving `ExecutionPolicy` decisions automatically from `DeviceContext`
  capabilities inside `AgentCore`.** Rejected: this would violate the
  `AgentCore != hardware implementation` and `Device capability != Agent
  permission` invariants by letting orchestration logic branch on device
  facts directly. All such interpretation stays in `ExecutionPolicy`.
