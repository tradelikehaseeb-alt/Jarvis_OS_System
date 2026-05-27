# End-to-end Jarvis execution flow (Phase 50)

Connects the full Jarvis chain from user input through orchestrator execution to UI projections.

```
Voice / Chat Input
  → Speech Normalization (@jarvis/speech-service)
  → Intent Classification (desktop intent rules via intent-adapter)
  → Orchestrator executeCreateTask()
    → Hermes Gateway (planning)
    → OpenClaw Gateway (execution)
    → Execution Lifecycle
    → Memory Persistence
    → Event Stream
  → UI Projection (activity + agent status shapes)
  → Response summary
```

## Exports

| Export | Role |
|--------|------|
| `JarvisExecutionFlow` | `executeFlow()` + `getExecutionSummary()` |
| `JarvisExecutionFlowResult` | Full pipeline result with steps and stream events |
| `createDefaultJarvisExecutionFlow()` | Wires speech, intent, orchestrator, lifecycle, memory, stream |
| `DefaultJarvisExecutionFlow` | Injectable implementation |
| `buildExecutionSummary()` | Condensed summary from flow result |
| `projectUiFromTaskStatus()` | Desktop-aligned activity + agent status projection |

## Usage

```typescript
const flow = await createDefaultJarvisExecutionFlow();
const result = await flow.executeFlow({
  rawInput: "automate opening the dashboard",
  conversationId: "conv-1",
});
const summary = flow.getExecutionSummary(result);
// summary.handshake === true for automate intents
// summary.responseMessage — formatted assistant reply
```

## Constraints

- No API, speech-service, Hermes, or OpenClaw interface changes
- Stubs preserved — deterministic in-memory execution
- No browser/device control or LLM calls
- Intent classifier reused from desktop via `intent-adapter` (no duplicate rules)

## Tests

- `jarvis-execution-flow.test.ts` — unit tests for summary + projection
- `jarvis-execution-flow.integration.test.ts` — full automate + plan chains
- `jarvis-execution-flow.e2e.test.ts` — speech normalization + stream event coverage

Desktop integration: `apps/desktop/src/renderer/e2e/__tests__/jarvis-execution-flow.integration.test.ts`
