# @jarvis/hermes

**Hermes** — planning, reasoning, memory-access, task-decomposition.

## Phase 43 — gateway runtime boundary

| Layer | Path | Role |
|-------|------|------|
| Gateway | `src/gateway/` | `HermesGateway` — execute + runtime validation boundary |
| Agent | `src/hermes-agent.ts` | Orchestrator entry; calls gateway + skills |
| Adapter | `adapter/` | `HermesAdapter` — official integration plug-in point |

```
Desktop → API → Orchestrator → HermesAgent → HermesGateway → Hermes Runtime → Structured Planning Result
                                                    ↘ SkillExecutor → SearchSkill
```

Gateway module (`src/gateway/`) provides:

- `HermesGatewayRequest`
- `HermesGatewayResponse`
- `HermesRuntimeStatus`
- `HermesRuntimeValidation`
- `HermesGateway`
- `DefaultHermesGateway`
- `createDefaultHermesGateway()`

Supported operations:

- `execute()`
- `getRuntimeStatus()`
- `validateRuntime()`

Stub mode remains default (`HERMES_MODE=stub`). No LLM execution in this phase.

## Phase 44 — runtime wiring

Gateway runtime resolution uses `@jarvis/provider-registry` and `@jarvis/runtime-manager`:

```
HermesAgent → HermesGateway → ProviderResolver → RuntimeResolver → Runtime Discovery
```

Runtime wiring module (`hermes-gateway-runtime-wiring.ts`):

- `resolveProviderMetadata()` — configured Hermes provider from registry
- `resolveConfiguredRuntime()` — detection via runtime-manager
- `getRuntimeHealth()` — health probe via runtime-manager

Stub execution preserved; discovery only (no LLM).

## Phase 59 — runtime planning handshake

Runtime session module (`src/runtime/`):

```
Orchestrator → HermesGateway → HermesRuntimeSession → Runtime Process Manager → Hermes Runtime
```

| Export | Role |
|--------|------|
| `HermesRuntimeSession` | Session contract |
| `HermesPlanningState` | Session lifecycle state |
| `HermesPlanningHandshake` | Handshake result |
| `HermesRuntimeHealth` | Validation health snapshot |
| `createHermesRuntimeSession()` | Session factory |

Session operations:

- `initializeSession()`
- `validateRuntime()`
- `generatePlan()`
- `terminateSession()`

`DefaultHermesGateway.execute()` runs the full handshake path. Stub mode remains
the default fallback. Optional `HermesRuntimeProcessBinding` connects to Jarvis
runtime process manager without changing gateway interfaces.

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
