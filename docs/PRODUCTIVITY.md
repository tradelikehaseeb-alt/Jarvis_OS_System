# Productivity Automation (Phase 98)

Jarvis as a **daily AI operating partner** — email summaries, task organization, research briefings, scheduling, and continuous assistance through voice or text.

## Modules

| Module | Path |
|--------|------|
| `ProductivityWorkflowRuntime` | `services/orchestrator/src/productivity-automation/` |
| `DailyAssistantRuntime` | same |
| `SmartSchedulingRuntime` | same |
| `ResearchAutomationRuntime` | same |
| `CommunicationAutomationRuntime` | same |
| `TaskPlanningRuntime` | same |
| `PersonalContextRuntime` | same |
| Productivity sessions | `services/local-memory/src/productivity-session-store.ts` |
| Hermes hint | `agents/hermes/src/productivity/` |
| OpenClaw role | `agents/openclaw/src/productivity/` |
| Voice intent | `services/speech-service/src/productivity/` |
| Desktop UI | `apps/desktop/src/renderer/productivity/` |

## Example commands

- "Summarize unread emails and prepare my priorities."
- "Research today's AI news and brief me."
- "Prepare my trading research workspace."
- "Organize my tasks for today."
- "Remember this project direction."
- "Prepare a meeting summary."

## Task output

```typescript
productivity: {
  sessionId: string;
  success: boolean;
  summary: string;
  activities: Array<{ kind, userLabel, message, completed, timestamp }>;
  suggestions: Array<{ message, kind }>;
  taskCount: number;
}
```

User-facing labels only — **Reviewing emails…**, **Organizing priorities…**, **Completed.**

See also: [AGENTS.md](./AGENTS.md), [MEMORY.md](./MEMORY.md), [VOICE.md](./VOICE.md), [VISION.md](./VISION.md).
