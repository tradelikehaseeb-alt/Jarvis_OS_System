# Runtime health (Phase 74)

```
Runtime Startup Manager → RuntimeHealthRuntime → aggregateRuntimeHealth → Desktop Dashboard
```

Aggregates process manager, startup manager, speech, and memory probes into a single
health snapshot for Desktop visibility.

## Exports

| Export | Role |
|--------|------|
| `RuntimeHealthEvent` | Health timeline events |
| `RuntimeHealthRuntime` | `getRuntimeHealth`, `subscribeRuntimeHealth`, `aggregateRuntimeHealth`, `getStartupProgress` |
| `createDefaultRuntimeHealthRuntime()` | Factory with process + startup + activity stream delegates |
| `aggregateRuntimeHealth()` | Pure aggregation helper |

## Components surfaced

Hermes, OpenClaw, Speech, Memory, API Runtime, Orchestrator.

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator
```
