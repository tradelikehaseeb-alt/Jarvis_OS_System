# @jarvis/hermes

**Hermes** — planning, reasoning, memory-access, task-decomposition.

## Phase 16 — adapter boundary

| Layer | Path | Role |
|-------|------|------|
| Agent | `src/hermes-agent.ts` | Orchestrator entry; calls adapter + skills |
| Adapter | `adapter/` | `HermesAdapter` — official integration plug-in point |

```
Orchestrator → HermesAgent → HermesAdapter.invoke() → SkillExecutor → SearchSkill
```

Stub default: `HermesAdapterStub` (static plan/reasoning). **Phase 22:** `HermesPlanningAdapter` returns structured `{ goal, steps }` via the same interface.

See [adapter/README.md](./adapter/README.md) and [adapter/official/README.md](./adapter/official/README.md).

## Phase 22 — planning spike

```typescript
import { createHermesAgent, createHermesPlanningAdapter } from "@jarvis/hermes";

const hermes = createHermesAgent(skillExecutor, createHermesPlanningAdapter());
```

Set `HERMES_PLANNING_ADAPTER=planning` for bootstrap to use the planning adapter automatically.

## Usage

```typescript
import { createDefaultSkillPipeline } from "@jarvis/agents-shared";
import { createHermesAgent, createHermesAdapterStub } from "@jarvis/hermes";

const { skillExecutor } = await createDefaultSkillPipeline();
const hermes = createHermesAgent(skillExecutor, createHermesAdapterStub());
```

## Constraints

- No LLM or external Hermes SDK in stub mode
- Memory via Memory Service APIs only (future)
- UI never imports Hermes directly

## Tests

```bash
npm run test --workspace=@jarvis/hermes
```
