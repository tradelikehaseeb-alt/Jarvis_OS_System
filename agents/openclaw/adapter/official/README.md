# OpenClaw official runtime discovery (Phase 21)

`OpenClawRuntimeDiscoveryAdapter` implements `@jarvis/runtime-manager` `RuntimeProvider` for **`openclaw-local`** only.

## Behavior

- Reads `OPENCLAW_ENDPOINT` and `OPENCLAW_MODE`
- Returns `RuntimeDetection` / `RuntimeHealth` with `RuntimeStatus`
- Safe HTTP probe to the gateway origin only — **no OpenClaw execution** or automation

## Environment

| Variable | Description |
|----------|-------------|
| `OPENCLAW_MODE` | `stub` (default), `local`, `official`, or `remote` |
| `OPENCLAW_ENDPOINT` | Gateway base URL. Defaults to `http://127.0.0.1:18789` when mode is `local`/`official` |

## RuntimeManager integration

```typescript
import {
  createHybridRuntimeManager,
  createDefaultRuntimeResolver,
} from "@jarvis/runtime-manager";
import {
  createHermesRuntimeDiscoveryAdapter,
} from "@jarvis/hermes";
import {
  createOpenClawRuntimeDiscoveryAdapter,
} from "@jarvis/openclaw";

const manager = createHybridRuntimeManager([
  createHermesRuntimeDiscoveryAdapter(),
  createOpenClawRuntimeDiscoveryAdapter(),
]);
const resolver = createDefaultRuntimeResolver(undefined, manager);
```

## Tests

```bash
npm run test --workspace=@jarvis/openclaw
```
