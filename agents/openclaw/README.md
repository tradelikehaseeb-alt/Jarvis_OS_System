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

## Phase 58 — runtime execution handshake

Runtime session module (`src/runtime/`):

```
Orchestrator → OpenClawGateway → OpenClawRuntimeSession → Runtime Process Manager → OpenClaw Runtime
```

| Export | Role |
|--------|------|
| `OpenClawRuntimeSession` | Session contract |
| `OpenClawExecutionState` | Session lifecycle state |
| `OpenClawExecutionHandshake` | Handshake result |
| `OpenClawRuntimeHealth` | Validation health snapshot |
| `createOpenClawRuntimeSession()` | Session factory |

Session operations:

- `initializeSession()`
- `validateRuntime()`
- `executeTask()`
- `terminateSession()`

`DefaultOpenClawGateway.execute()` runs the full handshake path. Stub mode remains
the default fallback. Optional `OpenClawRuntimeProcessBinding` connects to Jarvis
runtime process manager without changing gateway interfaces.

## Phase 61 — browser runtime path

Browser runtime module (`src/browser-runtime/`):

```
OpenClaw Runtime → Browser Runtime Bootstrap → Browser Runtime Session → Execution Result
```

| Export | Role |
|--------|------|
| `BrowserRuntimeBootstrap` | Bootstrap contract (Phase 68) |
| `BrowserRuntimeConfig` | Bootstrap configuration |
| `BrowserRuntimeSessionInfo` | Bootstrap session snapshot |
| `BrowserRuntimeValidator` | Runtime validation contract |
| `createDefaultBrowserRuntimeBootstrap()` | Stub bootstrap factory |
| `BrowserRuntimeSession` | Browser session contract |
| `BrowserExecutionRequest` | Browser task request |
| `BrowserExecutionResult` | Stub execution result |
| `BrowserRuntimeHealth` | Browser validation snapshot |
| `createBrowserRuntimeSession()` | Direct stub session factory |
| `runBrowserRuntimePath()` | Bootstrap-backed execution path |

Stub validation and execution only — no real browsing automation.

## Phase 68 — browser runtime bootstrap

```
Desktop → API Runtime → Orchestrator → OpenClaw Runtime → Browser Runtime Bootstrap → Execution Session
```

Bootstrap operations:

- `initializeRuntime()`
- `validateRuntime()`
- `createSession()`
- `terminateRuntime()`

Existing stub session path preserved when an explicit `BrowserRuntimeSession` is injected.
Gateway, adapter, and orchestrator interfaces unchanged.

## Phase 69 — browser action execution pipeline

```
Desktop → API Runtime → Orchestrator → OpenClaw Runtime → Browser Runtime → Action Pipeline → Execution Result
```

| Export | Role |
|--------|------|
| `BrowserAction` | Stub action kinds |
| `BrowserActionRequest` | Single action request |
| `BrowserActionResult` | Single action result |
| `BrowserActionPipeline` | Pipeline contract |
| `BrowserActionValidator` | Action validation |
| `createDefaultBrowserActionPipeline()` | Stub pipeline factory |

Pipeline operations:

- `validateAction()`
- `executeAction()`
- `executePipeline()`

Stub actions: `open-page`, `click-element`, `type-text`, `extract-content`. Legacy `navigate` maps to `open-page`.
No real browser automation or device control.

## Phase 70 — browser page context runtime

```
Desktop → API Runtime → Orchestrator → OpenClaw Runtime → Browser Runtime → Page Context Runtime → Action Pipeline
```

| Export | Role |
|--------|------|
| `BrowserPageContext` | Active page/session context |
| `BrowserPageSnapshot` | Point-in-time page snapshot |
| `BrowserSessionState` | Context lifecycle state |
| `BrowserContextRuntime` | Page context contract |
| `createDefaultBrowserContextRuntime()` | Stub context factory |

Context operations:

- `initializeContext()`
- `updateContext()`
- `getCurrentContext()`
- `clearContext()`

Page state persists across pipeline actions within a browser session. Stub fallback preserved.

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
