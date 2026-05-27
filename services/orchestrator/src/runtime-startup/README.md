# Runtime startup (Phase 73)

```
Desktop Start → Runtime Bootstrap → Health Validation → Recovery Manager → Ready
```

Coordinates managed process startup, health probes, and recovery without duplicating
process-manager or API health logic.

## Exports

| Export | Role |
|--------|------|
| `RuntimeStartupState` | Aggregate phase + probe counts |
| `RuntimeStartupEvent` | Bootstrap / validation / recovery timeline |
| `RuntimeStartupManager` | `initializeRuntime`, `validateRuntime`, `recoverRuntime`, `getStartupStatus` |
| `RuntimeRecoveryHandler` | Deterministic restart decisions |
| `createDefaultRuntimeStartupManager()` | Process-manager + probe factory |
| `createDefaultRuntimeRecoveryHandler()` | Restart failed probes via process manager |

## Flow

1. **Bootstrap** — optional delegate + start managed processes (`api-runtime`, `orchestrator`, `hermes-runtime`, `openclaw-runtime`)
2. **Validate** — run health probes (process manager + optional API / speech probes)
3. **Recover** — restart failed processes and re-validate
4. **Ready** — `phase: "ready"` when all probes pass

Phases: `idle` → `bootstrapping` → `validating` → `ready` | `degraded` | `failed` (with `recovering` on retry).

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator
```
