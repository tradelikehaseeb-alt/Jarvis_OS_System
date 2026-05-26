# @jarvis/skills-shared

Shared **skills framework** for Jarvis OS — contracts and abstract base only (Phase 9).

Agents invoke skills through {@link BaseSkill}; UI and api-gateway never call skills directly.

## Contracts

| Export | Purpose |
|--------|---------|
| `BaseSkill` | `metadata` + `execute(input, context)` |
| `AbstractBaseSkill` | Optional abstract class for class-based skills |
| `SkillCapability` | read, write, search, transform, etc. |
| `SkillMetadata` | Registry descriptor + `sideEffectCapable` |
| `SkillInput` | Agent → skill invocation payload |
| `SkillOutput` | Skill → agent result |
| `SkillContext` | Invocation context (memory via APIs only) |
| `SkillRegistry` | Register / resolve skills |

## Layer

```
UI → api-gateway → orchestrator → agents → skills (BaseSkill)
```

## Rules

- No Hermes, OpenClaw, business logic, automation, memory storage, or HTTP
- Side-effect skills require OpenClaw gateway sandbox (Phase 10+)
- May depend on `@jarvis/types` for shared DTOs

## Tests

```bash
npm run test --workspace=@jarvis/skills-shared
npm run build --workspace=@jarvis/skills-shared
```

## Phase 11

Agents invoke skills via `@jarvis/agents-shared` `SkillExecutor` — not direct imports.

## Phase 12+

Add concrete skills under `skills/<name>/` extending `AbstractBaseSkill`.
