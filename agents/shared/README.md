# @jarvis/agents-shared

Agent framework and **agent→skill execution pipeline** (Phase 11–13).

## Agent contracts (Phase 8–10)

`BaseAgent`, `AgentMetadata`, `AgentTask`, `AgentResult`, `AgentContext`, `AgentRegistryContract`, `InMemoryAgentRegistry`

## Skill pipeline (Phase 11–13)

| Export | Purpose |
|--------|---------|
| `SkillExecutionRequest` | Agent → executor request |
| `SkillExecutionResponse` | Executor → agent response |
| `AgentSkillBinding` | Which skills an agent may call |
| `AgentSkillBindingRegistry` | Binding registry contract |
| `InMemorySkillBindingRegistry` | In-memory bindings |
| `SkillExecutor` | Dispatch interface |
| `DefaultSkillExecutor` | Resolves **SkillRegistry only** |
| `createDefaultSkillPipeline()` | Register concrete skills + bindings + executor |
| `SEARCH_SKILL_ID`, `FILE_SKILL_ID`, `BROWSER_SKILL_ID` | Phase 13 skill ids |

### Bindings (Phase 13)

| Agent | Skills |
|-------|--------|
| Hermes | `search-skill` |
| OpenClaw gateway | `browser-skill`, `file-skill` |

## Flow

```
Agent.execute()
  → SkillExecutor.execute()
    → AgentSkillBindingRegistry (allowed skills)
    → SkillRegistry.resolve()
      → BaseSkill.execute()
```

Agents must **never** import concrete skills directly.

## Usage

```typescript
import { createDefaultSkillPipeline } from "@jarvis/agents-shared";
import { createHermesAgent } from "@jarvis/hermes";

const { skillExecutor } = await createDefaultSkillPipeline();
const hermes = createHermesAgent(skillExecutor);
```

Or use `@jarvis/agents-bootstrap` for full registration.

## Tests

```bash
npm run test --workspace=@jarvis/agents-shared
```
