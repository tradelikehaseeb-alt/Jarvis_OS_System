# @jarvis/runtime-manager

External **runtime detection and health** for Hermes and OpenClaw (Phase 20–21).

- **Phase 20:** `MockRuntimeProvider` — static detection/health, no network.
- **Phase 21:** Official discovery adapters in `@jarvis/hermes` / `@jarvis/openclaw` — env + safe HTTP probe only.

## Types

| Export | Role |
|--------|------|
| `RuntimeStatus` | `unknown` \| `available` \| `unavailable` \| `degraded` |
| `RuntimeHealth` | Result of a health check |
| `RuntimeDetection` | Configured endpoint detection (no I/O in stub mode) |
| `RuntimeProvider` | Per-runtime `detect()` + `checkHealth()` |
| `RuntimeManager` | Registry of providers |
| `RuntimeResolver` | Uses `@jarvis/provider-registry` config + manager |

## Supported runtime ids

Aligned with `@jarvis/provider-registry`:

- `hermes-local`, `hermes-cloud`
- `openclaw-local`, `openclaw-remote`

Default mock health:

| Runtime | Default status |
|---------|----------------|
| `hermes-local`, `openclaw-local` | `available` |
| `hermes-cloud`, `openclaw-remote` | `degraded` (not live-probed) |

## Usage

```typescript
import { createDefaultRuntimeResolver } from "@jarvis/runtime-manager";

const resolver = createDefaultRuntimeResolver();
const report = await resolver.checkConfiguredRuntimes();

console.log(report.hermes.status, report.openclaw.endpoint);
```

## Flow

```
ProviderConfig (provider-registry)
  → RuntimeResolver
    → RuntimeManager
      → RuntimeProvider (MockRuntimeProvider today)
        → RuntimeHealth / RuntimeDetection
```

## Official discovery (Phase 21)

```typescript
import { createDiscoveryRuntimeResolver } from "@jarvis/runtime-manager";
import { createHermesRuntimeDiscoveryAdapter } from "@jarvis/hermes";
import { createOpenClawRuntimeDiscoveryAdapter } from "@jarvis/openclaw";

const resolver = createDiscoveryRuntimeResolver([
  createHermesRuntimeDiscoveryAdapter(),
  createOpenClawRuntimeDiscoveryAdapter(),
]);
```

| Env (Hermes) | Env (OpenClaw) |
|--------------|----------------|
| `HERMES_MODE`, `HERMES_ENDPOINT` | `OPENCLAW_MODE`, `OPENCLAW_ENDPOINT` |

See `agents/hermes/adapter/official/README.md` and `agents/openclaw/adapter/official/README.md`.

## Tests

```bash
npm run test --workspace=@jarvis/runtime-manager
```

## Related

- `@jarvis/provider-registry` — provider selection
- `docs/HERMES_INTEGRATION_PLAN.md`
- `docs/OPENCLAW_INTEGRATION_PLAN.md`
