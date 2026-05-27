# @jarvis/runtime-process

Deterministic runtime process manager for Jarvis OS services (Phase 55).

```
Desktop → API Runtime → Process Manager → Orchestrator → Hermes/OpenClaw Runtime → Response
```

## Components

| Export | Role |
|--------|------|
| `RuntimeProcess` | Process snapshot (id, label, state, timestamps) |
| `RuntimeProcessState` | `stopped` \| `starting` \| `running` \| `restarting` \| `failed` |
| `RuntimeHealth` | Aggregate health report for all managed processes |
| `RuntimeProcessManager` | Start/stop/restart/monitor contract |
| `InMemoryRuntimeProcessManager` | Deterministic in-memory implementation |
| `createDefaultRuntimeProcessManager()` | Registers default Jarvis runtime processes |

## Default processes

- `api-runtime` — Jarvis API Runtime
- `orchestrator` — Jarvis Orchestrator
- `hermes-runtime` — Hermes Runtime
- `openclaw-runtime` — OpenClaw Runtime

## Usage

```typescript
import { createDefaultRuntimeProcessManager } from "@jarvis/runtime-process";

const manager = createDefaultRuntimeProcessManager({
  processHandlers: {
    "api-runtime": {
      start: async () => { /* start embedded API server */ },
      stop: async () => { /* stop embedded API server */ },
    },
  },
});

await manager.startProcess("api-runtime");
await manager.startProcess("orchestrator");
console.log(manager.getHealth());
console.log(manager.getActiveProcesses());
```

## Constraints

- Deterministic only — no real OS process spawning
- Preserves existing stubs — default handlers are no-ops
- No browser/device control or LLM execution
- No HTTP API contract changes
