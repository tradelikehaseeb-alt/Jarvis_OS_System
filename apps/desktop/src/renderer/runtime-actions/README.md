# Runtime actions (Phase 57)

```
Desktop → Runtime Dashboard → Runtime Actions → Process Manager → Runtime Service
```

Allows the Desktop runtime dashboard to start, stop, restart, and refresh health
for managed Jarvis services.

## Components

| Export | Role |
|--------|------|
| `RuntimeAction` | `start` \| `stop` \| `restart` \| `refresh-health` |
| `RuntimeActionRequest` | IPC action request |
| `RuntimeActionResponse` | IPC action result + optional health snapshot |
| `useRuntimeActions()` | Hook with loading state and action helpers |
| `RuntimeActionPanel` | Per-process control buttons |

## IPC

Renderer calls `window.jarvis.executeRuntimeAction(request)`.
Main process delegates to `executeRuntimeAction()` → `RuntimeProcessManager`.

## Constraints

- Preserves existing dashboard and chat behavior
- No speech-service, Hermes, or OpenClaw changes
- No browser/device control
