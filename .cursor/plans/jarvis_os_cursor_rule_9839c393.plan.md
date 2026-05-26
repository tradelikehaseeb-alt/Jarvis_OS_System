---
name: Jarvis OS Cursor Rule
overview: Create a single always-on Cursor project rule at `.cursor/rules/jarvis-os.mdc` with product context, layered architecture, memory ownership (Jarvis Memory Service), agent boundaries, and OpenClaw sandbox/permission rules.
todos:
  - id: create-rules-dir
    content: Create `.cursor/rules/` directory in workspace
    status: pending
  - id: write-jarvis-os-mdc
    content: Add `jarvis-os.mdc` with alwaysApply frontmatter and condensed rule body
    status: pending
  - id: verify-rule-active
    content: Confirm rule appears in Cursor Rules UI and applies to new chats
    status: pending
isProject: false
---

# Jarvis OS Cursor Rule

## Current state

- No [`.cursor/rules/`](d:\Jarvis_Os System\.cursor\rules) directory exists yet (only [`.cursor/skills/`](d:\Jarvis_Os System\.cursor\skills)).
- Architecture enforcement already lives in skills you should **reference**, not duplicate:
  - [architecture-review/SKILL.md](d:\Jarvis_Os System\.cursor\skills\architecture-review\SKILL.md) — layer boundaries, OpenClaw ban from UI, SOLID
  - [review-before-create/SKILL.md](d:\Jarvis_Os System\.cursor\skills\review-before-create\SKILL.md) — scan before new files/folders
  - [strict-typescript/SKILL.md](d:\Jarvis_Os System\.cursor\skills\strict-typescript\SKILL.md) — TS strict mode
  - [generate-module-tests/SKILL.md](d:\Jarvis_Os System\.cursor\skills\generate-module-tests\SKILL.md) — tests per module

Your global user rules already repeat much of this; the **project rule** makes the same constraints apply to anyone opening this repo in Cursor, without relying on personal user rules.

## Scope (confirmed)

- **Always apply** (`alwaysApply: true`) — every chat in this workspace gets Jarvis OS context and architecture guardrails.

## Deliverable: one focused rule file

Create:

**[`.cursor/rules/jarvis-os.mdc`](d:\Jarvis_Os System\.cursor\rules\jarvis-os.mdc)**

Per the [create-rule skill](file:///C:/Users/Haseeb%20Rasheed/.cursor/skills-cursor/create-rule/SKILL.md): use YAML frontmatter + markdown body, stay **under ~50 lines**, one primary concern (project identity + non-negotiable architecture).

### Frontmatter

```yaml
---
description: Jarvis OS product context, layered architecture, and agent boundaries
alwaysApply: true
---
```

(No `globs` — not needed when `alwaysApply: true`.)

### Body structure (concise, actionable)

| Section | Content (distilled from your brief) |
|---------|-------------------------------------|
| **Identity** | Jarvis OS = production AI OS / SaaS, not a simple chatbot |
| **Capabilities** | Bullet list: conversations, desktop/workflow automation, memory, multi-agent, plugins, skills, learning, RAG, APIs, subscriptions |
| **Purpose** | Reduce app-switching friction; AI as thinking/planning/executing layer |
| **Users & value** | Target personas (freelancers, traders, agencies, creators, devs, SMB, enterprise); **target value: 1–4 hours/day saved (5–8+ heavy users)** — context only, not implementation requirements |
| **Architecture** | Mandatory stack diagram in text + mermaid |

```mermaid
flowchart LR
  UI --> API
  API --> Orchestrator
  Orchestrator --> Agents
  Agents --> Skills
```

| **Agent roles** | **Hermes**: planning, reasoning, memory access, task decomposition. **OpenClaw**: browser/desktop automation, execution |
| **Memory ownership** | **Jarvis Memory Service** owns persistent memory; Hermes reads/writes via memory APIs only; Hermes must not directly store persistent memory |
| **Non-negotiable rules** | Rules 1–6 as before; **rule 7**: OpenClaw execution requires permission checks and sandbox boundaries |
| **When to go deeper** | One line: run `architecture-review` and `review-before-create` skills on cross-layer or scaffolding work |

### Example violations (keep 2–3 short examples)

Include minimal good/bad patterns so the rule is concrete (skill best practice):

- **Bad:** `frontend/` imports `openclaw` client or calls execution SDK directly.
- **Good:** UI calls API route; API → Orchestrator → agent selects OpenClaw skill.
- **Bad:** New `utils/formatDate.ts` when identical helper exists in `shared/`.
- **Good:** Extend existing shared module after grep/search.
- **Bad:** Hermes agent writes `fs.writeFile` or local DB for user long-term memory.
- **Good:** Hermes calls `memoryApi.store()` / `memoryApi.query()` (Jarvis Memory Service).

### What to omit (avoid bloat)

- Long marketing copy or repeated tables from `architecture-review` skill
- Duplicating full SOLID checklists or review templates (skills already own that)
- Splitting into multiple `.mdc` files **for now** — draft is ~55 lines with memory ownership; still one file; split later only if you add file-specific rules (e.g. `**/*.tsx` UI patterns)

## Relationship to existing user rules

After this file exists, you can optionally **trim** overlapping Jarvis bullets from Cursor **User Rules** to avoid triple-stating the same constraints (user rule + project rule + skills). Not required for the rule to work.

## Verification after implementation

1. Open Cursor **Rules** (or rule picker) — `jarvis-os` should show with “Always apply”.
2. Start a new agent chat in this workspace — agent should treat Jarvis as layered OS, not chatbot.
3. Ask agent to “add a button that calls OpenClaw” — it should refuse UI bypass and route through API/Orchestrator.
4. Ask agent to “save user memory inside Hermes” — it should route through Jarvis Memory Service APIs, not agent-local storage.

## File to create (full draft for approval)

```markdown
---
description: Jarvis OS product context, layered architecture, and agent boundaries
alwaysApply: true
---

# Jarvis OS

Production-grade AI Operating System and SaaS platform — **not** a simple chatbot.

Combines: AI conversations, desktop/workflow automation, long-term memory, multi-agent orchestration, plugins, skills, adaptive learning, knowledge retrieval, APIs, and subscriptions.

**Goal:** Turn AI into an operating layer that thinks, plans, and executes — reducing friction across browser, email, notes, spreadsheets, automation, and files.

**Users:** freelancers, traders, travel agencies, content creators, developers, SMBs, enterprise.

**Target value:** 1–4 hours/day saved (5–8+ heavy users).

## Architecture (strict)

UI → API → Orchestrator → Agents → Skills

- **Hermes** — planning, reasoning, memory access, task decomposition
- **OpenClaw** — browser/desktop automation, execution (behind API/Orchestrator only)

## Memory ownership

- **Jarvis Memory Service** owns persistent memory
- **Hermes** reads/writes through memory APIs only
- **Hermes must not** directly store persistent memory

## Non-negotiable rules

1. User only sees **Jarvis** UI — never expose Hermes/OpenClaw as separate products in the client.
2. **Frontend must never** import, configure, or call OpenClaw (or bypass API/Orchestrator/Agents).
3. **No duplicate** code, folders, or near-identical logic — extract to shared modules.
4. **Scan the repo** before creating files; reuse existing components and modules.
5. **TypeScript strict**; document non-obvious APIs; **tests for every new module**.
6. Production-ready, modular, SOLID-friendly design.
7. **OpenClaw execution** requires permission checks and sandbox boundaries.

## Examples

```typescript
// BAD — UI bypasses API/Orchestrator
import { openClaw } from '@jarvis/openclaw';
await openClaw.run(task);

// GOOD — UI → API only
await jarvisApi.post('/tasks', { intent });

// BAD — Hermes persists memory directly
await hermesLocalStore.save(userId, facts);

// GOOD — Hermes via Jarvis Memory Service
await memoryApi.store({ userId, facts });
```

For PRs, scaffolding, or cross-layer changes: use project skills `architecture-review` and `review-before-create`.
```

## Implementation step (after you approve)

1. Create directory `d:\Jarvis_Os System\.cursor\rules\`
2. Write `jarvis-os.mdc` with the draft above (minor edits welcome)
3. No changes to skills or application code in this task
