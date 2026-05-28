# Jarvis AI Workforce (Phase 97)

Jarvis coordinates a **personal AI workforce** — specialized workers that run in parallel, share context, and return a single coordinated result. Users only see Jarvis labels (e.g. **Researching…**, **Analyzing…**, **Preparing summary…**, **Completed.**).

## Architecture

```
UI → API → Orchestrator (AgentWorkforceRuntime) → Agents → Skills
```

| Module | Location | Role |
|--------|----------|------|
| `AgentWorkforceRuntime` | `services/orchestrator/src/agent-workforce/` | Main coordination facade |
| `TaskDelegationEngine` | same | Parses intent into worker plans |
| `ParallelExecutionCoordinator` | same | Parallel/sequential execution, dedup, timeout |
| `PersistentAgentSession` | same | In-memory agent sessions |
| `WorkflowSupervisorRuntime` | same | Loop detection, cancellation, recovery |
| `AgentCapabilityRegistry` | same | Worker types and user-facing labels |
| `LongRunningTaskRuntime` | same | Background task tracking |
| Workforce session store | `services/local-memory/` | Persists session metadata |
| Hermes hint | `agents/hermes/src/workforce/` | Multi-agent planning hints |
| OpenClaw role | `agents/openclaw/src/workforce/` | Execution role + sandbox mapping |
| Desktop UI | `apps/desktop/src/renderer/workforce/` | Timeline + activity panel |

## Worker types (initial)

| Type | User label |
|------|------------|
| Research | Researching… |
| Browser | Performing task… |
| Coding | Working… |
| Market | Analyzing… |
| Scheduling | Scheduling… |
| Document | Preparing summary… |
| Communication | Sending… |

## Example workflow

**User:** "Jarvis, research AI news, summarize market impact, and prepare a trading brief."

1. Research worker gathers news (stub/live via agents)
2. Market worker analyzes impact
3. Document worker prepares summary
4. Jarvis streams progress in the command center
5. Coordinated summary returned in `task.output.workforce`

## Task output shape

```typescript
workforce: {
  sessionId: string;
  success: boolean;
  summary: string;
  activities: Array<{
    workerType: string;
    userLabel: string;
    message: string;
    completed: boolean;
    timestamp: string;
  }>;
  workerCount: number;
  parallel: boolean;
}
```

## Safety

- Execution isolation via OpenClaw sandbox flags
- Task timeout protection in `ParallelExecutionCoordinator`
- Workflow cancellation via `WorkflowSupervisorRuntime`
- Agent recovery on repeated steps (anti-loop)
- No uncontrolled autonomous loops — supervisor gates each step

## Tests

- `services/orchestrator/src/agent-workforce/__tests__/`
- `apps/desktop/src/renderer/workforce/__tests__/`
- `services/local-memory/src/__tests__/workforce-session-store.test.ts`
- `agents/hermes/src/workforce/__tests__/`
- `agents/openclaw/src/workforce/__tests__/`

See also: [MEMORY.md](./MEMORY.md) (workforce sessions), [EXECUTION.md](./EXECUTION.md), [VISION.md](./VISION.md).
