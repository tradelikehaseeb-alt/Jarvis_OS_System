# Execution Learning Runtime (Phase 79)

Learns from adaptive execution outcomes and adjusts future adaptive decisions.

## Flow

```
Adaptive execution result → LearningRuntime → LocalMemoryRuntime → future applyLearning()
```

## API

| Symbol | Role |
|--------|------|
| `ExecutionLearningRecord` | Persisted outcome snapshot |
| `LearningSignal` | Derived pattern (`stable_success`, `elevated_failure_rate`, …) |
| `LearningDecisionRule` | Maps signals to adaptive rule adjustments |
| `LearningRuntime` | `recordExecutionOutcome()`, `evaluateLearning()`, `applyLearning()`, `getLearningInsights()` |
| `createDefaultLearningRuntime()` | Factory wired to `LocalMemoryRuntime` |

## Behavior

- Stores records via `LocalMemoryRuntime` (`execution` type) — no duplicate storage layer.
- Reuses `AdaptiveExecutionRule` output from `applyLearning()` for next handshake.
- Deterministic fallback when no history (`no_data` signal → base rules unchanged).
- Stub executions are recorded and included in insights.
