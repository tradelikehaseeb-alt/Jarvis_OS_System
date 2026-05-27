# Hermes runtime planning handshake (Phase 59)

```
Orchestrator → HermesGateway → HermesRuntimeSession → Runtime Process Manager → Hermes Runtime
```

## Session flow

1. `initializeSession()` — optional process manager ensure-running
2. `validateRuntime()` — runtime-manager health + process state
3. `generatePlan()` — adapter stub/planning path (no external LLM)
4. `terminateSession()` — cleanup handshake state

## Usage

```typescript
import {
  createHermesRuntimeSession,
  createHermesGatewayRuntimeWiring,
  createHermesAdapterStub,
} from "@jarvis/hermes";

const session = createHermesRuntimeSession({
  adapter: createHermesAdapterStub(),
  runtimeWiring: createHermesGatewayRuntimeWiring({ env: { HERMES_MODE: "stub" } }),
});

await session.initializeSession();
await session.validateRuntime();
const handshake = await session.generatePlan(request);
await session.terminateSession();
```

## Constraints

- Stub fallback preserved
- Runtime validation only — no external LLM provider
- Gateway and adapter interfaces unchanged
