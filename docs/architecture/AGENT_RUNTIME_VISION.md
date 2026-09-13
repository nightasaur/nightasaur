# Nightasaur Agent Runtime Vision

Status: Draft (architecture discussion, not yet implemented)
Scope: Long-term vision for the Nightasaur Agent Runtime. This document does
not authorize or describe any v0.3 code changes; see
[`ADR-0001-RUNTIME-IDENTITY-CAPABILITY-MODEL.md`](./ADR-0001-RUNTIME-IDENTITY-CAPABILITY-MODEL.md)
for the scoped, decided architecture of the next implementation phase.

## 1. Vision statement

> Nightasaur is an open, device-first AI Agent runtime that provides a
> baseline level of participation in the Agent World, while allowing
> compute, models, tools, memory, and services to scale independently.

Nightasaur is not a chatbot wrapper around one model, and it is not a Cloud
product with an open-source marketing veneer. It is a runtime: a set of
stable abstractions (`AgentCore`, `ModelProvider`, `ToolRegistry`,
`MemoryProvider`, `ExecutionPolicy`, and the runtime/device/identity concepts
introduced in this document) that let an Agent exist, keep its identity, and
act consistently regardless of which device it runs on, which model answers
it, which tools it can call, or which company operates the surrounding
service.

The business principle that governs this runtime's evolution is stated
plainly so that every future architecture decision can be checked against
it:

> **Open-source the runtime. Monetize the operation.**

The runtime itself — orchestration, provider abstraction, tool execution,
execution policy, memory contracts, identity and capability model — is
built to be open and self-hostable. Monetization is expected to happen at
the *operation* layer (Nightasaur Cloud, hosted compute, managed memory,
premium integrations, support), never by holding the runtime itself hostage
to a specific paid backend. A user must always be able to run Nightasaur
against a local/BYOM (bring-your-own-model) or BYOK (bring-your-own-key)
backend without being forced to buy any particular commercial API, including
GitHub Copilot.

## 2. Architecture invariants

These are non-negotiable properties the runtime must preserve at every
version. They are invariants, not aspirations — any design that violates one
of these should be treated as a defect in that design, not as an acceptable
trade-off.

### 2.1 `Agent != Model`

An Agent (its identity, memory, permissions, and behavior contract) is not
the same thing as the model that currently answers on its behalf. The model
is a swappable execution resource. Today it may be `qwen2.5:3b` via Ollama;
tomorrow it may be a cloud model, a fine-tuned local model, or a different
provider entirely — the Agent's identity, history, and permissions must
survive that swap unchanged. `AgentCore` already reflects this: it depends
on the `ModelProvider` interface, never on a concrete model implementation.

### 2.2 `Device capability != Agent permission`

What a device *can physically do* (has a camera, has a GPU, is online) is a
separate axis from what an Agent *is allowed to do* (may call a given tool,
may access a given memory scope, may act without confirmation). A capable
device does not automatically grant an Agent permission, and a permitted
action is not automatically possible on every device. These two concepts
must be modeled separately so that policy decisions (`ExecutionPolicy`) are
never accidentally derived from hardware probing, and hardware constraints
are never silently treated as authorization decisions.

### 2.3 `AgentCore != hardware implementation`

`AgentCore` is a pure orchestration engine. It must never contain camera
drivers, microphone capture, GPU scheduling, or any other physical I/O
implementation. Device-specific capabilities are described to `AgentCore`
declaratively (see `Capability`, §3) and consumed through
provider/tool/policy abstractions — never hardcoded into the orchestration
loop itself. This mirrors the same discipline already applied to
`ModelProvider` (no model-specific logic lives in `AgentCore`) and
`ToolRegistry` (no tool-specific logic lives in `AgentCore`).

### 2.4 `Open Runtime != Nightasaur Cloud`

The open-source runtime (this repository) and the future Nightasaur Cloud
operation are architecturally distinct products. Nightasaur Cloud may be
built *on top of* the runtime (as a `ProviderContext`, a `MemoryProvider`
backend, a billing/operations layer, etc.), but the runtime must never
develop a hard dependency on Cloud-only infrastructure. Anyone must be able
to clone this repository, run it fully locally against a self-hosted model,
and get a working Agent with no network calls to any Nightasaur-operated
service.

## 3. Core principles

- **Open Runtime.** The orchestration engine, abstractions, and reference
  implementations are open source. Anyone can read, audit, fork, and
  self-host the entire runtime.
- **Device-First.** The runtime is designed to run close to the user's own
  device(s) first, with Cloud as an optional accelerant, not a requirement.
  A phone, a small home server, or a laptop should all be legitimate primary
  hosts for an Agent.
- **Agent identity and model are decoupled.** An Agent's identity
  (`AgentIdentity`, §4) is a first-class, persistent concept independent of
  any particular `ModelProvider` instance backing it at a given moment.
- **Provider Neutrality.** No abstraction in the runtime may be designed
  around one vendor's API shape. This was already established for model
  tool-calling in v0.2 (native vs. prompt-based fallback capability split)
  and extends to compute, storage, and identity providers as the runtime
  grows.
- **Independent Scaling.** Compute, models, tools, memory, and services must
  be able to scale (up, down, out, or be swapped entirely) independently of
  one another and independently of the Agent's identity or the device it
  runs on.
- **Baseline Participation.** Any device meeting a minimal `RuntimeContext`
  contract should be able to run *some* useful Agent — even with no
  network, no Cloud account, and a small local model — rather than requiring
  a fully-featured environment just to participate in the Agent World at
  all. Richer devices and richer backends unlock more capability, but never
  gate the baseline.

## 4. Key concepts (vocabulary for future ADRs)

These concepts are introduced here as shared vocabulary. Their concrete
shape, scope, and integration into `AgentCore` are decided (for v0.3) in
[ADR-0001](./ADR-0001-RUNTIME-IDENTITY-CAPABILITY-MODEL.md), not in this
document.

- **`RuntimeContext`** — Describes the runtime environment a given
  `AgentCore.run()` is executing in (e.g. which host/process, which
  provider/memory backends are wired up, environment-level constraints).
  It is the top-level container that other contexts (below) attach to.
- **`DeviceContext`** — Describes the physical/logical device an Agent is
  currently associated with: what hardware capabilities it declares (see
  `Capability`), connectivity state, and other device-level facts. This is
  descriptive data, never a permission grant (§2.2).
- **`AgentIdentity`** — The stable, persistent identity of an Agent: who/what
  it is, independent of which model, device, or provider is currently
  serving it. This is what "the same Agent" means across model swaps,
  device moves, and provider changes.
- **`Capability`** — A declarative statement of something a device, tool, or
  provider can do (e.g. "has microphone input", "supports native tool
  calling", "has persistent storage"). Capabilities are inputs to policy
  decisions; they are not themselves authorization.
- **`ProviderContext`** — The minimal set of information describing which
  concrete providers (model, memory, future compute/storage) are active for
  a given run, without leaking provider-specific implementation detail into
  `AgentCore`.
- **`ExecutionPolicy`** — Already introduced in v0.2 as the boundary that
  decides `allow` / `deny` / `confirmation_required` for a tool call. In the
  long term, this is also where device capability, agent identity, and
  runtime context are expected to inform policy decisions, without
  `AgentCore` itself ever branching on device or provider specifics.

## 5. The Agent World: long-term direction

The long-term goal is an **Agent World**: a network of Nightasaur Agents,
each with a durable identity, running across many different devices,
models, and providers, able to participate at a baseline level anywhere and
scale up richly where the environment allows it. Getting there requires,
in roughly this order:

1. Solidify the runtime/device/identity/capability vocabulary (this
   document) and make the smallest correct architectural decision for the
   next step (ADR-0001).
2. Extend `AgentCore` to accept optional runtime/device/identity context
   without breaking any existing caller that doesn't provide it.
3. Let `ExecutionPolicy` evolve to consume that context for real policy
   decisions (still not implemented in v0.2; `AllowAllExecutionPolicy`
   remains the default until there is a concrete need).
4. Only once identity, capability, and policy are solid does it make sense
   to talk about Agent-to-Agent or Device-to-Device networking, distributed
   execution, or a Nightasaur Cloud operation layer — none of which are in
   scope for v0.3 (see ADR-0001, Non-Goals).

This document intentionally does not commit to a networking protocol,
persistence technology, or Cloud product design. Those decisions should be
made later, against a stable identity/capability model, not before one
exists.
