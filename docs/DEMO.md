# Jarvis Demo Workflows (Phase 96)

Canonical human demo scenarios validated end-to-end through orchestrator live execution.

## Demo commands

1. Jarvis, open YouTube and summarize AI news
2. Jarvis, open Gmail and check unread emails
3. Jarvis, search latest gold market updates
4. Jarvis, open TradingView and prepare workspace
5. Jarvis, remember this for later

## Architecture

```
Voice / Chat → VoiceWorkflowSession → Orchestrator → DemoScenarioRuntime
                                      ↓
                         InteractionValidationRuntime + HumanInteractionMetrics
```

## Modules

| Module | Location |
|--------|----------|
| `DemoScenarioRuntime` | `services/orchestrator/src/demo-validation/` |
| `InteractionValidationRuntime` | same |
| `RealExecutionTelemetry` | same |
| `HumanInteractionMetrics` | same |
| `VoiceWorkflowSession` | `services/speech-service/src/voice-execution/` |

## Run validation tests

```bash
npm run test --workspace=@jarvis/orchestrator -- --run src/demo-validation
npm run test --workspace=@jarvis/speech-service -- --run src/voice-execution
npm run test --workspace=@jarvis/desktop -- --run src/renderer/demo
```

See also: [EXECUTION.md](./EXECUTION.md), [VOICE.md](./VOICE.md)
