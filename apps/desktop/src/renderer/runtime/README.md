# Runtime dashboard (Phase 56, 73–74)

```
Desktop Start → Runtime Startup Manager → Runtime Health Aggregation → Runtime Dashboard
```

Exposes live Jarvis runtime state — startup progress, component health, process manager
status, and recovery — via IPC.

## Components

| Export | Role |
|--------|------|
| `RuntimeDashboardPage` | Full dashboard page |
| `RuntimeHealthPanel` | Hermes, OpenClaw, Speech, Memory health |
| `RuntimeStatusBadge` | Compact component health badge |
| `RuntimeStartupProgress` | Bootstrap phase progress bar |
| `useRuntimeHealth()` | Polls process + aggregated health IPC |
| `useRuntimeStartup()` | Startup sync and recovery |
| `RuntimeDashboard` | Process manager grid |
| `RuntimeStartupPanel` | Startup timeline + recovery controls |

## IPC

| Channel | Role |
|---------|------|
| `jarvis:getRuntimeHealth` | Process manager snapshot |
| `jarvis:getAggregatedRuntimeHealth` | Aggregated component health + startup progress |
| `jarvis:getStartupStatus` | Startup manager state |

## Constraints

- No speech-service interface changes
- Reuses orchestrator `RuntimeHealthRuntime` in main process
- Chat behavior unchanged
