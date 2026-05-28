# Jarvis OS Stability & Recovery

Phase **94** production hardening for long-running desktop usage.

## Capabilities

| Area | Implementation |
|------|----------------|
| Runtime recovery | `RuntimeRecoveryManager` → startup recovery |
| Provider resilience | `ProviderHealthMonitor` scoring + fallback |
| Safe execution | `SafeExecutionFallbackRuntime` + task `stability` output |
| Session restore | Desktop checkpoints + `SessionRestoreRuntime` |
| Crash recovery | `DesktopCrashRecovery` + main-process init guard |
| Performance | `PerformanceTelemetryRuntime` + speech sample bridge |

## User-facing UI

- `ReconnectIndicator` — subtle reconnect/degraded states
- Task output `stability.message` — no internal runtime names

## Offline / degraded behavior

- Provider stub fallback (existing LLM runtime)
- Safe execution modes: `normal`, `degraded`, `stub`, `offline`
- IPC fetch retry with backoff (desktop API handlers)

## Docs

- Phase README: `services/orchestrator/src/runtime-hardening/PHASE-94-README.md`
- Providers: [PROVIDERS.md](./PROVIDERS.md)
