# agents/

**Layer:** Autonomous agents — invoked only by the orchestrator (never from UI).

| Package | Agent | Phase |
|---------|-------|-------|
| `shared/` | `@jarvis/agents-shared` | Framework + `InMemoryAgentRegistry` |
| `hermes/` | `@jarvis/hermes` | Hermes stub (Phase 10) |
| `openclaw/` | `@jarvis/openclaw` | OpenClaw gateway stub (Phase 10) |
| `bootstrap/` | `@jarvis/agents-bootstrap` | Register both agents |

## Agent → skill pipeline (Phase 11)

Agents invoke skills **only** via `SkillExecutor` + `SkillRegistry` — see `@jarvis/agents-shared`.

## Register defaults

```typescript
import { registerDefaultAgents } from "@jarvis/agents-bootstrap";

const { registry, pipeline, hermes, openClaw } = await registerDefaultAgents();
```

## Flow

```
api-gateway → orchestrator → agents (BaseAgent) → skills
```

## Constraints

- UI and api-gateway must **not** import agent implementations for execution
- Hermes: memory via Memory Service APIs only (Phase 11+)
- OpenClaw: sandbox + permissions before real automation (Phase 11+)
