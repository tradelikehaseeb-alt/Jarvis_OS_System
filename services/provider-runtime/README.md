# @jarvis/provider-runtime

Provider connection runtime for Hermes and OpenClaw (Phase 60).

```
Orchestrator → Hermes/OpenClaw Runtime → Provider Connection → Response
```

## Components

| Export | Role |
|--------|------|
| `ProviderConnection` | Connection snapshot |
| `ProviderSession` | Active connection session |
| `ProviderHealth` | Connection health report |
| `ProviderRuntime` | connect/disconnect/validate contract |
| `ProviderRegistry` | Registered connectable providers |
| `createDefaultProviderRuntime()` | Stub default factory |

## Usage

```typescript
import {
  createDefaultProviderRuntime,
  DEFAULT_HERMES_PROVIDER_ID,
} from "@jarvis/provider-runtime";

const runtime = createDefaultProviderRuntime();
await runtime.connect(DEFAULT_HERMES_PROVIDER_ID);
await runtime.validateConnection(DEFAULT_HERMES_PROVIDER_ID);
console.log(await runtime.getHealth());
await runtime.disconnect(DEFAULT_HERMES_PROVIDER_ID);
```

## Constraints

- Stub connections remain default fallback
- Connection path only — no real external APIs
- Existing agent/gateway interfaces unchanged
