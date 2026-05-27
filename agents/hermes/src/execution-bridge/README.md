# Hermes Execution Bridge (Phase 77)

Maps Hermes structured planning output into OpenClaw-executable task chains.

## Flow

```
Hermes structured plan → HermesExecutionBridge → OpenClaw task descriptors
```

## API

| Symbol | Role |
|--------|------|
| `HermesExecutionPlan` | Goal + ordered executable steps |
| `HermesExecutionStep` | Single mapped step with stub flag |
| `HermesExecutionBridge` | `createExecutionPlan()` + `mapPlanToTasks()` |
| `createDefaultHermesExecutionBridge()` | Default bridge factory |

## Behavior

- Reuses existing Hermes plan payloads (`structuredPlan`, `plan`, gateway stub flags).
- Falls back to stub steps when no structured plan is present.
- Does not route tasks — orchestrator `TaskChainRuntime` executes mapped steps.
