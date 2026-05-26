# Architecture Review — Reference

## Example flows

**Good — user triggers a task**

```
UI (button) → API POST /tasks → Orchestrator.start(taskId)
  → Agent.run() → Skill.execute()
```

**Bad — UI bypass**

```
UI → import { openclawClient } from '...'  // Critical
UI → orchestrator.runTask()                 // Critical
```

**Bad — API skips orchestration**

```
API handler → agent.invoke() directly       // Critical (unless documented exception)
```

## OpenClaw placement

| Location | Verdict |
|----------|---------|
| `ui/`, `frontend/`, React/Vue/Svelte components | ❌ Never |
| `api/` route handlers calling a gateway service | ✅ |
| `orchestrator/` workflow steps | ✅ |
| `agents/` via injected gateway interface | ✅ |
| `skills/` only if skill is server-side and not bundled to client | ⚠️ Confirm no client bundle |

Search patterns (adapt to repo):

- `from ['"].*openclaw`
- `OpenClaw`, `openclaw_`, `OPENCLAW_`
- Direct `fetch`/`axios` to OpenClaw URLs from UI paths

## Duplicate examples

| Pattern | Remedy |
|---------|--------|
| Same Zod/schema in UI and API | Single `shared/validation` or API-owned schema + generated types |
| Two agents with identical tool-setup | `agents/common/setupTools.ts` |
| Repeated retry/backoff in orchestrator and agent | `orchestrator/retryPolicy.ts` |

## SOLID violations (common)

- **SRP:** API handler that also runs full agent workflow — split handler vs orchestrator service.
- **OCP:** Giant `switch (taskType)` in orchestrator — strategy map or registered handlers.
- **DIP:** UI importing concrete OpenClaw class — introduce API contract + server implementation.

## Anti-patterns glossary

| Term | Meaning |
|------|---------|
| **Layer leak** | Import or call across more than one allowed hop |
| **God module** | File importing from 3+ layers or 500+ lines doing orchestration + IO + UI helpers |
| **Skill in UI** | Client bundle includes server-only skill or prompt templates with secrets |

## Review examples

**Input:** New React page calls `OpenClaw.chat()` for streaming.

**Output (Critical):** Move streaming to `API /chat/stream`; UI uses EventSource/fetch to API only.

**Input:** Two copy-pasted `mapTaskToDto` in api and orchestrator.

**Output (Suggestion):** Extract `shared/mappers/task.ts`; API and Orchestrator import it (shared must not import UI/API/Orchestrator).
