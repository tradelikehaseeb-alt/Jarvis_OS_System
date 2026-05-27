# Execution timeline (Phase 75)

```
Activity Stream → TimelineRuntime → executionTimeline task output → Desktop Task Progress View
```

Reuses activity stream and execution lifecycle events — no duplicate event bus.

## Exports

| Export | Role |
|--------|------|
| `TimelineEvent` | Orchestrator timeline event |
| `TimelineRuntime` | `startTimeline`, `appendTimelineEvent`, `completeTimeline`, `subscribeTimeline` |
| `createDefaultTimelineRuntime()` | Activity-stream-backed factory |
| `toTimelineEvent()` | Maps activity stream → timeline |

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator
```
