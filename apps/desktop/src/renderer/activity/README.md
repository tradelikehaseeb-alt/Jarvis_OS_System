# Activity timeline (Phase 48)

Desktop live activity UI for Jarvis planning, execution, and memory updates.

```
ChatPage → useActivityStream → ActivityPanel → ActivityTimeline
                ↓
        Task status output (executionLifecycle + memory)
```

## Components

| Export | Role |
|--------|------|
| `ActivityEvent` | Timeline event model |
| `ActivityPanel` | Sidebar panel wrapper |
| `ActivityTimeline` | Ordered event list |
| `ActivityTimelineItem` | Single timeline row |
| `useActivityStream()` | Hook — staged loading + task status ingest |

## Event kinds

- `planning_started` / `planning_completed`
- `execution_started` / `execution_completed`
- `memory_saved` / `conversation_updated`
- `failed`

While a task runs, the hook plays a deterministic staged progression. When the orchestrator response arrives, events are merged from `executionLifecycle` and `memory` output fields.

No WebSockets yet — consumes existing task status payload only.
