# Task Chain Runtime (Phase 77)

Executes Hermes structured plans as sequential OpenClaw task chains via the orchestrator.

## Flow

```
Hermes planning result → HermesExecutionBridge → TaskChainRuntime → OpenClaw steps
```

## API

| Symbol | Role |
|--------|------|
| `TaskChainEvent` | Chain lifecycle events (`chain_started`, `step_completed`, …) |
| `TaskChainRuntime` | `createExecutionPlan()`, `mapPlanToTasks()`, `executeTaskChain()` |
| `createDefaultTaskChainRuntime()` | Wires bridge + OpenClaw step executor + lifecycle/timeline |

## Behavior

- Reuses `@jarvis/hermes` execution bridge — no duplicate plan mapping.
- Delegates each step to the injected OpenClaw executor (existing agent registry path).
- Preserves stub fallback when planning payload is missing or stubbed.
- Emits lifecycle activities and optional timeline `action_progress` events per step.
