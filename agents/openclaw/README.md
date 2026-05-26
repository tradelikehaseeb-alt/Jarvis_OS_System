# @jarvis/openclaw

**OpenClaw Gateway** — execution, browser-automation, desktop-automation (Phase 10 stub).

Extends `AbstractBaseAgent`. No real automation, no UI imports, no LLM.

## Capabilities (stub metadata)

| Id | Kind |
|----|------|
| openclaw-execution | execution |
| openclaw-browser | browser-automation |
| openclaw-desktop | desktop-automation |

## Usage

```typescript
import { InMemoryAgentRegistry } from "@jarvis/agents-shared";
import { registerOpenClawAgent } from "@jarvis/openclaw";

const registry = new InMemoryAgentRegistry();
await registerOpenClawAgent(registry);
```

## Constraints

- Invoked only via orchestrator (never from `apps/`)
- `executionCapable: true` — sandbox + permissions in Phase 11+
