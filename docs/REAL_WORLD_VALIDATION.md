# Real World Jarvis Validation (Phase 100)

Phase 100 validates Jarvis as a **real daily-usable AI operating partner** — not new architecture.

## Philosophy

**REAL > MOCK** · **USEFULNESS > FEATURES** · **EXECUTION > ARCHITECTURE** · **QUALITY > COMPLEXITY**

Stub fallback remains safety-only. Real providers are the primary execution path when configured.

## Validation areas

| Area | Module / tests |
|------|----------------|
| Real providers | `real-world-validation/provider-failover-validator.ts` |
| Voice commands | `speech-service/src/real-world/`, desktop e2e |
| Browser execution | `real-world-validation/real-browser-workflow-validator.ts` |
| Long sessions | `long-session-stability-validator.ts`, local-memory continuity |
| Voice interruption | `voice-interruption-validator.ts` |
| Full pipeline | `RealWorldValidationRuntime` |

## Canonical commands

Defined in `@jarvis/types` → `REAL_WORLD_VOICE_COMMANDS`, `REAL_WORLD_VALIDATION_COMMANDS`.

## Run validation

```bash
npm run test --workspace=@jarvis/orchestrator -- --run src/real-world-validation
npm run test --workspace=@jarvis/desktop -- --run real-world-validation
```

See also: [PROVIDERS.md](./PROVIDERS.md), [VOICE.md](./VOICE.md), [EXECUTION.md](./EXECUTION.md), [REAL_WORLD_USAGE.md](./REAL_WORLD_USAGE.md).
