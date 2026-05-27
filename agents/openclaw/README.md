# @jarvis/openclaw

**OpenClaw Gateway** — execution, browser-automation, desktop-automation.

## Phase 42 — gateway runtime boundary

| Layer | Path | Role |
|-------|------|------|
| Gateway | `src/gateway/` | `OpenClawGateway` — execute + runtime validation boundary |
| Agent | `src/openclaw-agent.ts` | Orchestrator entry; calls gateway + skills |
| Adapter | `adapter/` | `OpenClawAdapter` — stub/official plug-in point |

```
Desktop → API → Orchestrator → OpenClawAgent → OpenClawGateway → OpenClaw Runtime → Execution Result
                                                      ↘ SkillExecutor → BrowserSkill, FileSkill
```

Gateway module (`src/gateway/`) provides:

- `OpenClawGatewayRequest`
- `OpenClawGatewayResponse`
- `OpenClawRuntimeStatus`
- `OpenClawGateway`
- `DefaultOpenClawGateway`
- `createDefaultOpenClawGateway()`

Supported operations:

- `execute()`
- `getRuntimeStatus()`
- `validateRuntime()`

Stub mode remains default (`OPENCLAW_MODE=stub`). No browser/device control in this phase.

## Phase 44 — runtime wiring

Gateway runtime resolution uses `@jarvis/provider-registry` and `@jarvis/runtime-manager`:

```
OpenClawAgent → OpenClawGateway → ProviderResolver → RuntimeResolver → Runtime Discovery
```

Runtime wiring module (`openclaw-gateway-runtime-wiring.ts`):

- `resolveProviderMetadata()` — configured OpenClaw provider from registry
- `resolveConfiguredRuntime()` — detection via runtime-manager
- `getRuntimeHealth()` — health probe via runtime-manager

Stub execution preserved; discovery only (no browser/device control).

## Phase 16 — adapter boundary

| Layer | Path | Role |
|-------|------|------|
| Agent | `src/openclaw-agent.ts` | Orchestrator entry; calls adapter + skills |
| Adapter | `adapter/` | `OpenClawAdapter` — official gateway plug-in point |

```
Orchestrator → OpenClawAgent → OpenClawAdapter.invoke() → SkillExecutor → BrowserSkill, FileSkill
```

Stub default: `OpenClawAdapterStub` (static acceptance). Official OpenClaw replaces the adapter only.

See [adapter/README.md](./adapter/README.md).

## Usage

```typescript
import { createDefaultSkillPipeline } from "@jarvis/agents-shared";
import { createOpenClawAgent, createOpenClawAdapterStub } from "@jarvis/openclaw";

const { skillExecutor } = await createDefaultSkillPipeline();
const openclaw = createOpenClawAgent(skillExecutor, createOpenClawAdapterStub());
```

## Constraints

- Invoked only via orchestrator (never from `apps/`)
- No real browser/desktop automation in stub mode
- Frontend never calls OpenClaw directly

## Tests

```bash
npm run test --workspace=@jarvis/openclaw
```
