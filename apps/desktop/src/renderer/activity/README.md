# Activity timeline (Phase 48, 71)

Desktop live activity UI for Hermes/OpenClaw planning, execution, and memory updates.

```
ChatPage → useActivityStream → ActivityPanel → ActivityTimeline
                ↓
        task output.activityStream (Phase 71)
                ↓
        executionLifecycle + memory (fallback)
```

## Components

| Export | Role |
|--------|------|
| `ActivityEvent` | Timeline event model |
| `ActivityPanel` | Sidebar panel wrapper |
| `ActivityTimeline` | Ordered event list |
| `ActivityTimelineItem` | Single timeline row |
| `useActivityStream()` | Hook — staged loading + live stream ingest |
| `mapActivityStreamToEvents()` | Maps orchestrator `activityStream.events` |

## Hook API (Phase 71)

- `startStream()` — begin staged progress while task runs
- `stopStream()` — end staged streaming
- `subscribe()` / `unsubscribe()` — panel/runtime listeners
- `ingestTaskStatus()` — merge real orchestrator activity stream events

## Event kinds

- `planning_started` / `planning_completed`
- `execution_started` / `execution_completed`
- `memory_saved` / `conversation_updated`
- `failed`

While a task runs, the hook plays a deterministic staged progression. When the orchestrator response arrives, events merge from `activityStream`, `executionLifecycle`, and `memory` output fields.

No WebSockets yet — consumes task status payload from API runtime.
