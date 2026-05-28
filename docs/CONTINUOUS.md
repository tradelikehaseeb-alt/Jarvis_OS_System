# Continuous Jarvis Runtime (Phase 99)

Jarvis as a **continuous AI operating partner** — proactive assistance, background workflows, persistent sessions, and smart notifications.

## Modules

| Module | Path |
|--------|------|
| `ContinuousJarvisRuntime` | `services/orchestrator/src/continuous-runtime/` |
| `ProactiveWorkflowEngine` | same |
| `BackgroundTaskSupervisor` | same |
| `PersistentSessionManager` | same |
| `SmartNotificationRuntime` | same |
| `ContextAwarenessRuntime` | same |
| `ContinuousExecutionScheduler` | same |
| Continuous sessions | `services/local-memory/src/continuous-session-store.ts` |
| Hermes hint | `agents/hermes/src/continuous/` |
| OpenClaw role | `agents/openclaw/src/continuous/` |
| Voice intent | `services/speech-service/src/continuous/` |
| Desktop UI | `apps/desktop/src/renderer/continuous/` |

## Example commands

- "Monitor gold market changes and alert me."
- "Keep watching AI news and summarize important updates."
- "Remind me when this task completes."
- "Continue this workflow in background."
- "Prepare my daily briefing every morning."

## Task output

```typescript
continuous: {
  sessionId: string;
  success: boolean;
  summary: string;
  activities: Array<{ kind, userLabel, message, background, completed, timestamp }>;
  notifications: Array<{ kind, message, userLabel }>;
  backgroundTaskCount: number;
  continuous: boolean;
  presence: "active" | "background" | "idle";
}
```

See also: [PRODUCTIVITY.md](./PRODUCTIVITY.md), [VOICE.md](./VOICE.md), [MEMORY.md](./MEMORY.md), [VISION.md](./VISION.md).
