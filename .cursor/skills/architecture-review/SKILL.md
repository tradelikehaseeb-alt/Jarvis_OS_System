---
name: architecture-review
description: >-
  Review generated code and enforce layered architecture (UI → API →
  Orchestrator → Agents → Skills). Detects duplicate code, blocks direct UI
  access to OpenClaw, suggests reusable modules, and checks SOLID. Use when
  reviewing PRs, generated code, refactors, or when the user asks for
  architecture review or /architecture-review.
disable-model-invocation: true
---

# Architecture Review

Review generated code and enforce architecture:

UI → API → Orchestrator → Agents → Skills

Detect duplicate code.
Prevent direct UI access to OpenClaw.
Suggest reusable modules.
Maintain SOLID principles.

## When to run

Apply this skill when:

- Reviewing new or changed code (PR, diff, or generated output)
- Adding features that touch UI, API, agents, or OpenClaw
- Refactoring or extracting shared logic

Read only what you need for the change set. Prefer grep/search for layer violations before reading whole trees.

## Layer model

Allowed dependency direction (each layer may call only the layer to its right):

| Layer | Role | May import / call |
|-------|------|-------------------|
| **UI** | Presentation, routing, forms, client state | **API** only (HTTP/SDK clients) |
| **API** | HTTP/gRPC handlers, auth, validation, DTO mapping | **Orchestrator** |
| **Orchestrator** | Workflows, composition, retries, session/task routing | **Agents** |
| **Agents** | Autonomous steps, tool use, sub-task execution | **Skills** |
| **Skills** | Focused capabilities (tools, prompts, scripts) | Shared libs, external SDKs — not UI |

**Forbidden (flag as Critical):**

- UI → Orchestrator, Agents, Skills, or **OpenClaw** (any bypass of API)
- API → Agents or Skills directly (skip Orchestrator)
- Orchestrator → Skills directly (skip Agents), unless the repo documents a narrow exception
- Circular dependencies between layers

**OpenClaw:** Integration lives behind API and/or Orchestrator. UI must never import, instantiate, or call OpenClaw clients, env keys, or SDKs.

## Review workflow

1. **Map the change** — List files touched; assign each to a layer (or `shared` / `infra`).
2. **Check boundaries** — Trace imports and runtime calls; confirm flow matches UI → API → Orchestrator → Agents → Skills.
3. **OpenClaw** — Search for `openclaw`, `OpenClaw`, or project-specific client paths from `ui/`, `frontend/`, `app/`, `components/`.
4. **Duplicates** — Find repeated logic (copy-paste, near-identical functions, parallel DTOs). Prefer one module.
5. **SOLID** — See checklist below.
6. **Report** — Use the output template; fix Critical items before merge.

## Duplicate detection

Treat as duplicate when two or more sites share the same **behavior** (not merely similar names):

- Identical or near-identical functions/hooks/components
- Repeated validation, mapping, or error-handling blocks
- Copy-pasted agent prompts or skill instructions

**Actions:**

- Extract to `shared/`, `lib/`, or layer-appropriate module (lowest layer that all callers may use)
- If only two call sites, extract when duplication is ≥ ~6 lines or likely to grow
- Note extracted module path in recommendations

## Reusable modules

Suggest extraction when:

- Logic is used (or will be used) across layers — split so lower layers do not depend on higher ones
- A skill/agent pattern repeats — shared skill helper or agent base, not copy-paste
- API and Orchestrator both need the same rule — shared domain module called from API (thin) and Orchestrator (workflow)

Name by capability: `user-session`, `task-routing`, `openclaw-gateway` (behind API/Orchestrator only).

## SOLID checklist

| Principle | Quick check |
|-----------|-------------|
| **S**ingle responsibility | One reason to change per module/class |
| **O**pen/closed | Extend via interfaces/plugins, not editing core switches |
| **L**iskov | Subtypes honor base contracts (no surprise throws/returns) |
| **I**nterface segregation | Small interfaces; UI/API do not depend on agent-only APIs |
| **D**ependency inversion | High-level modules depend on abstractions; wire OpenClaw behind gateways |

## Output template

```markdown
# Architecture Review

## Summary
[1–2 sentences: pass / pass with suggestions / blocked]

## Layer compliance
| Check | Status | Notes |
|-------|--------|-------|
| UI → API only | ✅/❌ | |
| API → Orchestrator | ✅/❌ | |
| Orchestrator → Agents | ✅/❌ | |
| Agents → Skills | ✅/❌ | |
| No UI → OpenClaw | ✅/❌ | |

## Findings

### Critical (must fix)
- [file:line] — violation — suggested fix

### Suggestions
- [file:line] — improvement

### Duplicates
- [locations] — extract to `[proposed module]`

### Reusable modules
- [proposal]

## SOLID notes
[Brief bullets only where relevant]
```

Severity:

- **Critical** — Layer violation, UI→OpenClaw, or SOLID break that causes tight coupling or untestable design
- **Suggestion** — Duplicates, naming, minor SRP issues
- **Nice to have** — Style or optional consolidation

## Fixing violations

When you implement fixes (if asked):

1. Move OpenClaw calls into API or Orchestrator gateway; expose narrow DTOs to UI.
2. Route new UI features through existing API clients; add endpoints/handlers, not agent imports in UI.
3. Extract duplicates to the lowest shared layer allowed by the dependency table.
4. Keep diffs minimal; do not refactor unrelated files.

## Project conventions

If the repo defines layer folders (e.g. `frontend/`, `api/`, `orchestrator/`), use those paths in findings. If layout is unclear, infer from imports and document assumed layer in the review.

For extended layer examples and anti-patterns, see [reference.md](reference.md).
