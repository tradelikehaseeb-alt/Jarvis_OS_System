# Hermes official adapters (Phase 21–22)

## Planning adapter (Phase 22)

`HermesPlanningAdapter` implements `HermesAdapter` for **controlled planning only**:

- Input: task description via `HermesRequest.intent.description`
- Output: structured plan `{ goal, steps }` inside `HermesResponse.plan`
- Wired through **`HermesAgent` only** — orchestrator flow unchanged
- No LLM calls, memory ownership, browser/desktop automation, or OpenClaw execution

### Example structured plan

```json
{
  "goal": "Plan my week",
  "steps": [
    "Clarify scope, constraints, and success criteria for the goal",
    "Break the goal into ordered, reviewable milestones",
    "Identify dependencies and risks before execution",
    "Validate the plan against the stated goal (planning only — no autonomous execution)"
  ]
}
```

### Enable planning adapter

| Variable | Values |
|----------|--------|
| `HERMES_PLANNING_ADAPTER` | `stub` (default) \| `planning` |

```typescript
import { createHermesAgent, createHermesPlanningAdapter } from "@jarvis/hermes";

const agent = createHermesAgent(skillExecutor, createHermesPlanningAdapter());
```

Or via provider resolver:

```typescript
import { createResolvedHermesAdapter } from "@jarvis/hermes";

const adapter = createResolvedHermesAdapter(providerResolver, {
  selection: "planning",
});
```

---

## Runtime discovery (Phase 21)

`HermesRuntimeDiscoveryAdapter` implements `@jarvis/runtime-manager` `RuntimeProvider` for **`hermes-local`** only.

## Behavior

- Reads `HERMES_ENDPOINT` and `HERMES_MODE` from the environment
- Reports `RuntimeDetection` and `RuntimeHealth` / `RuntimeStatus`
- Optional safe HTTP probe (HEAD/GET) to the configured origin — **no Hermes execution**, LLM calls, or skills

## Environment

| Variable | Description |
|----------|-------------|
| `HERMES_MODE` | `stub` (default), `local`, `official`, or `cloud` |
| `HERMES_ENDPOINT` | Base URL (e.g. `http://127.0.0.1:8080`). When mode is `local`/`official` and omitted, defaults to `http://127.0.0.1:8080` |

Discovery is **configured** when mode is `local` or `official`.

## RuntimeManager integration

```typescript
import {
  createHybridRuntimeManager,
  createDefaultRuntimeResolver,
} from "@jarvis/runtime-manager";
import { createHermesRuntimeDiscoveryAdapter } from "@jarvis/hermes";

const manager = createHybridRuntimeManager([
  createHermesRuntimeDiscoveryAdapter(),
]);
const resolver = createDefaultRuntimeResolver(undefined, manager);
const report = await resolver.checkConfiguredRuntimes();
```

## Tests

```bash
npm run test --workspace=@jarvis/hermes
```
