# Execution timeline (Phase 75)

```
Desktop → useExecutionTimeline → Activity Stream → TaskProgressPanel
```

Live task execution timeline from planning through completion.

## Components

| Export | Role |
|--------|------|
| `ExecutionTimeline` | Vertical timeline of steps |
| `TimelineStep` | Single step row |
| `TaskProgressPanel` | Progress bar + timeline |
| `useExecutionTimeline()` | Composes `useActivityStream` — no duplicate events |

## Displayed steps

Planning started → Planning completed → Execution started → Action progress → Completed/Failed

## Tests

```bash
npm run test --workspace=@jarvis/desktop
```
