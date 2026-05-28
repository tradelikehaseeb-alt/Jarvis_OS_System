# Phase 96 — Demo Validation

## Modules

- `DemoScenarioRuntime` — runs five canonical demo scenarios
- `InteractionValidationRuntime` — voice/execution/memory/latency checks
- `RealExecutionTelemetry` — span capture for demo sessions
- `HumanInteractionMetrics` — success rate, p95 latency, quality score

## Factory

```typescript
import { createTestDemoValidationBundle, runDemoValidation } from "@jarvis/orchestrator";
```

Voice workflow session lives in `@jarvis/speech-service` as `VoiceWorkflowSession`.
