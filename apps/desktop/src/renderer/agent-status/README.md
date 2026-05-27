# Agent status (Phase 49)

Live Hermes/OpenClaw thinking flow derived from the activity stream.

```
useActivityStream → useAgentStatus → AgentStatusPanel / AgentStatusBadge
```

## States

| Agent | States |
|-------|--------|
| Hermes | `idle`, `planning`, `completed`, `failed` |
| OpenClaw | `idle`, `executing`, `waiting`, `completed`, `failed` |

## Display messages

- Hermes planning…
- OpenClaw executing…
- Memory updating…
- Completed
- Errors

Consumes existing `ActivityEvent` data only — no API or agent package changes.
