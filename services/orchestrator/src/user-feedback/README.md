# User Feedback Intelligence Runtime (Phase 80)

Incorporates explicit user feedback into future adaptive execution decisions.

## Flow

```
Execution result → user feedback → FeedbackRuntime → LearningRuntime → AdaptiveExecutionRuntime
```

## API

| Symbol | Role |
|--------|------|
| `UserFeedbackRecord` | Persisted rating/comment for a task |
| `FeedbackSignal` | Derived pattern (`user_satisfied`, `user_frustrated`, …) |
| `FeedbackInsight` | Aggregated feedback + optional learning counts |
| `FeedbackRuntime` | `recordFeedback()`, `evaluateFeedback()`, `generateInsights()`, `applyFeedback()` |
| `createDefaultFeedbackRuntime()` | Factory wired to `LocalMemoryRuntime` + optional `LearningRuntime` |

## Task metadata

Submit feedback via `metadata.userFeedback`:

```json
{
  "userFeedback": {
    "taskId": "task-123",
    "rating": "negative",
    "comment": "Please retry failed steps"
  }
}
```

## Behavior

- Stores via `LocalMemoryRuntime` (`activity` type) — no duplicate storage layer.
- Composes with `LearningRuntime.applyLearning()` before `applyFeedback()` adjusts rules.
- Deterministic fallback when no feedback (`no_feedback` → base rules unchanged).
- Stub feedback is recorded and included in insights.
