# Live Provider Runtime (Phase 85)

End-to-end real provider validation:

```
Desktop Chat/Voice → Provider Settings → Live Provider Runtime
  → Hermes Planning → OpenClaw Execution → Timeline → Workspace
```

## API

| Export | Role |
|--------|------|
| `LiveProviderValidator` | Connection, health, live prompts, telemetry |
| `createDefaultLiveProviderRuntime()` | Production factory |
| `createTestLiveProviderRuntime()` | Stub-safe test factory |
| `ProviderHealthSnapshot` | Shared type (`@jarvis/types`) |
| `ProviderTelemetry` | Shared type (`@jarvis/types`) |

## Methods

- `validateProviderConnection(providerId)` — single provider probe
- `getProviderHealth()` — all seven providers
- `executeLivePrompt({ prompt })` — full Jarvis execution flow
- `captureProviderTelemetry(sessionId)` — spans + stream events
- `runValidationScenarios()` — three canonical validation prompts

## Validation prompts

1. What is the gold price today?
2. Summarize latest AI news
3. Explain Bitcoin trend today

Stub fallback remains active when API keys are absent.

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator
```
