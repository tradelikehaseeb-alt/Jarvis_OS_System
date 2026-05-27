# Runtime dashboard (Phase 56, 73)

```
Desktop Start → Runtime Bootstrap → Health Validation → Recovery → Ready
Desktop → Runtime Dashboard → Process Manager → Runtime Health
```

Exposes managed Jarvis runtime process status and startup lifecycle to the Desktop UI via IPC.

## Components

| Export | Role |
|--------|------|
| `RuntimeStatus` | UI-facing process snapshot |
| `RuntimeHealthEvent` | Health check / state-change timeline event |
| `useRuntimeHealth()` | Polls `jarvis:getRuntimeHealth` IPC |
| `useRuntimeStartup()` | Syncs startup status; `initializeRuntime`, `validateRuntime`, `recoverRuntime` |
| `RuntimeStartupPanel` | Startup phase + recovery controls |
| `RuntimeHealthCard` | Single process card |
| `RuntimeDashboard` | Aggregate health + process grid |

## Monitored processes

- API Runtime
- Orchestrator
- Hermes Runtime
- OpenClaw Runtime
- Speech Runtime (renderer-side probe)
- API `/health` probe

Each card shows process state, health, restart attempts, and errors.

## IPC

| Channel | Role |
|---------|------|
| `jarvis:getRuntimeHealth` | Process manager snapshot |
| `jarvis:initializeRuntime` | Bootstrap + validate |
| `jarvis:validateRuntime` | Re-run health probes |
| `jarvis:recoverRuntime` | Restart failed processes + validate |
| `jarvis:getStartupStatus` | Current startup state |

Main process bootstraps on app ready via `initializeApiRuntime()`; renderer syncs with `useRuntimeStartup({ autoSync: true })`.

## Constraints

- No HTTP API contract changes
- No speech-service interface changes
- Chat behavior unchanged
