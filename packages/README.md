# packages/

**Layer:** Shared TypeScript libraries used across `apps/` and (via API contracts) `services/`.

| Package | Name | Purpose |
|---------|------|---------|
| `types/` | `@jarvis/types` | Jarvis Core contracts + shared types |
| `logger/` | `@jarvis/logger` | Logging interfaces |
| `config/` | `@jarvis/config` | Environment config types |
| `shared-utils/` | `@jarvis/shared-utils` | Pure utility helpers |
| `provider-registry/` | `@jarvis/provider-registry` | Hermes/OpenClaw provider selection (Phase 17) |
| `runtime-manager/` | `@jarvis/runtime-manager` | Runtime detection + health (Phase 20) |

## Constraints

- No imports from `agents/`, Python services, or OpenClaw.
- Lowest shared layer — must not depend on `apps/`.
- Prefer `@jarvis/types` over duplicating types in apps.

## Related layers

- `@jarvis/agents-shared` — agent framework (`agents/shared`)
- `@jarvis/skills-shared` — skills framework (`skills/shared`)

## Phase 5

`@jarvis/types` exports memory contracts; `@jarvis/memory-service` implements stubs.

## Phase 2

`@jarvis/types` exports Jarvis Core contracts (interfaces only).

## Phase 1

Replaced monolithic `@jarvis/shared` with focused packages (scaffold only).
