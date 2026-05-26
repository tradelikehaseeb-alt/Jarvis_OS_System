# @jarvis/hermes

**Hermes** — planning, reasoning, memory-access, task-decomposition (Phase 10 stub).

Extends `AbstractBaseAgent` from `@jarvis/agents-shared`. No LLM, no local memory, no HTTP.

## Capabilities (stub metadata)

| Id | Kind |
|----|------|
| hermes-planning | planning |
| hermes-reasoning | reasoning |
| hermes-memory-access | memory-access |
| hermes-decomposition | task-decomposition |

## Usage

```typescript
import { InMemoryAgentRegistry } from "@jarvis/agents-shared";
import { registerHermesAgent } from "@jarvis/hermes";

const registry = new InMemoryAgentRegistry();
const hermes = await registerHermesAgent(registry);
```

## Phase 11+

Wire to Memory Service APIs; replace stub `execute` with real planning.
