# Runtime dashboard (Phase 56)

```
Desktop → Runtime Dashboard → Process Manager → Runtime Health
```

Exposes managed Jarvis runtime process status to the Desktop UI via IPC.

## Components

| Export | Role |
|--------|------|
| `RuntimeStatus` | UI-facing process snapshot |
| `RuntimeHealthEvent` | Health check / state-change timeline event |
| `useRuntimeHealth()` | Polls `jarvis:getRuntimeHealth` IPC |
| `RuntimeHealthCard` | Single process card |
| `RuntimeDashboard` | Aggregate health + process grid |

## Monitored processes

- API Runtime
- Orchestrator
- Hermes Runtime
- OpenClaw Runtime

Each card shows process state, health, restart attempts, and errors.

## IPC

Renderer calls `window.jarvis.getRuntimeHealth()` — main process reads
`buildRuntimeHealthSnapshot()` from the Phase 55 process manager.

## Constraints

- No HTTP API contract changes
- No speech-service, Hermes, or OpenClaw modifications
- Chat behavior unchanged
