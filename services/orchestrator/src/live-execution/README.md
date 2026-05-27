# Live Execution Runtime (Phase 84)

First real end-to-end live execution test path for Jarvis.

## Flow

```
Desktop Chat/Voice → Provider Settings → Real LLM Provider → Hermes Planning
  → OpenClaw Execution → Timeline → Workspace Response
```

## API

| Symbol | Role |
|--------|------|
| `LiveExecutionSession` | Session id, provider, task linkage |
| `LiveExecutionResult` | Full flow result + provider status + workspace response |
| `LiveExecutionTelemetry` | Spans and stream events |
| `createDefaultLiveExecutionRuntime()` | Factory composing e2e flow + provider settings |

## Validation commands

- Search gold price today
- Open Google and search AI news
- Summarize latest technology headlines

Stub fallback is preserved when providers are unconfigured.
