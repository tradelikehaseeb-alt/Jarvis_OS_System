# Adaptive Execution Runtime (Phase 78)

Adjusts Hermes task chain execution based on step results instead of fixed sequential chains.

## Flow

```
Hermes plan → TaskChainRuntime (plan mapping) → AdaptiveExecutionRuntime → OpenClaw steps
```

## API

| Symbol | Role |
|--------|------|
| `AdaptiveExecutionRule` | When/how to continue, retry, modify, or abort |
| `AdaptiveExecutionDecision` | Outcome of `evaluateExecution()` |
| `AdaptiveExecutionEvent` | Adaptive lifecycle events |
| `AdaptiveExecutionRuntime` | Core adaptive execution contract |
| `createDefaultAdaptiveExecutionRuntime()` | Wires TaskChainRuntime + TimelineRuntime |

## Methods

- `evaluateExecution()` — decide next action from step result
- `selectNextStep()` — pick the next OpenClaw task descriptor
- `retryExecution()` — re-run a failed step via injected executor
- `modifyExecutionPlan()` — replace remaining plan steps
- `executeAdaptively()` — full adaptive loop (delegates to fixed chain when `useFixedChain`)

## Behavior

- Reuses `TaskChainRuntime` for plan creation and task mapping — no duplicate routing.
- Reuses `TimelineRuntime` and lifecycle for progress events.
- Stub fallback: retry once on failure, then abort; success continues to next step.
- `useFixedChain: true` preserves Phase 77 fixed-chain path.
