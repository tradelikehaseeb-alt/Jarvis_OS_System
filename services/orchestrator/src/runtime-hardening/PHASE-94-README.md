# Phase 94 — Production Hardening & Stability

Resilience layer wrapping existing startup, provider health, recovery, and workspace modules.

## Orchestrator (`runtime-hardening/`)

| Module | Role |
|--------|------|
| `RuntimeRecoveryManager` | Unified startup/process recovery facade |
| `ProviderHealthMonitor` | Scored provider availability + fallback selection |
| `SafeExecutionFallbackRuntime` | Offline/degraded/stub execution decisions |
| `SessionRestoreRuntime` | Checkpoint + pending task restore |
| `PerformanceTelemetryRuntime` | Cross-operation latency samples |

Task output adds user-facing `stability` metadata.

## Desktop (`hardening/`)

| Module | Role |
|--------|------|
| `DesktopCrashRecovery` | Crash flag + recovery messaging |
| `SessionRestoreRuntime` | localStorage checkpoint restore |
| `ReconnectIndicator` | Subtle reconnect/degraded UI |

Main process: duplicate init guard + render-process-gone handler.

## Agents

- Hermes / OpenClaw: `evaluate*SafeExecution()` gateway helpers

## Speech service

- `recordSpeechOperationSample()` performance bridge

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator -- --run src/runtime-hardening
npm run test --workspace=@jarvis/desktop -- --run src/renderer/hardening
npm run test --workspace=@jarvis/speech-service -- --run src/hardening
npm run test --workspace=@jarvis/hermes -- --run src/hardening
npm run test --workspace=@jarvis/openclaw -- --run src/hardening
```
