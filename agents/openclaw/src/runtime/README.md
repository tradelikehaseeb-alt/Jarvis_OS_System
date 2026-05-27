# OpenClaw runtime execution handshake (Phase 58)

```
Orchestrator → OpenClawGateway → OpenClawRuntimeSession → Runtime Process Manager → OpenClaw Runtime
```

## Session flow

1. `initializeSession()` — optional process manager ensure-running
2. `validateRuntime()` — runtime-manager health + process state
3. `executeTask()` — adapter stub execution (no browser/device control)
4. `terminateSession()` — cleanup handshake state

## Usage

```typescript
import {
  createOpenClawRuntimeSession,
  createOpenClawGatewayRuntimeWiring,
} from "@jarvis/openclaw";
import { createOpenClawAdapterStub } from "@jarvis/openclaw";

const session = createOpenClawRuntimeSession({
  adapter: createOpenClawAdapterStub(),
  runtimeWiring: createOpenClawGatewayRuntimeWiring({ env: { OPENCLAW_MODE: "stub" } }),
});

await session.initializeSession();
await session.validateRuntime();
const handshake = await session.executeTask(request);
await session.terminateSession();
```

## Constraints

- Stub fallback preserved
- Runtime validation only — no real browser automation
- Gateway and adapter interfaces unchanged
