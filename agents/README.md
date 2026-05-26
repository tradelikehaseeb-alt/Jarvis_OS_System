# agents/

**Layer:** Autonomous agents — invoked only by the orchestrator (never from UI).

| Package | Agent | Phase |
|---------|-------|-------|
| `shared/` | `@jarvis/agents-shared` | Framework + `InMemoryAgentRegistry` |
| `hermes/` | `@jarvis/hermes` | Hermes agent + `adapter/` (Phase 16) |
| `openclaw/` | `@jarvis/openclaw` | OpenClaw gateway + `adapter/` (Phase 16) |
| `bootstrap/` | `@jarvis/agents-bootstrap` | Register both agents |

## Provider registry (Phase 17)

`@jarvis/provider-registry` selects configured providers before official integrations:

| Provider id | Family |
|-------------|--------|
| `hermes-local` / `hermes-cloud` | Hermes |
| `openclaw-local` / `openclaw-remote` | OpenClaw |

Bootstrap uses `createHermesAdapterFromProvider(resolver)` and `createOpenClawAdapterFromProvider(resolver)`.

## Adapter boundaries (Phase 16)

Official Hermes/OpenClaw integrations plug in behind:

- `agents/hermes/adapter/` — `HermesAdapter`, `HermesAdapterStub`
- `agents/openclaw/adapter/` — `OpenClawAdapter`, `OpenClawAdapterStub`

Agents still invoke skills **only** via `SkillExecutor` — adapters handle planning/gateway acceptance, not skill registry bypass.

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
