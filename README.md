# Jarvis OS

Production-grade AI Operating System and SaaS platform.

**Phase 15:** Task persistence via `TaskStore` abstraction (`InMemoryTaskStore`, `FileTaskStore`, `TaskStoreFactory`).

## Architecture

```
UI (apps) → API Gateway (services) → Orchestrator → Agents → Skills
```

| Layer | Path | Stack |
|-------|------|-------|
| Web UI | `apps/web` | Next.js, TypeScript |
| Desktop UI | `apps/desktop` | Electron, TypeScript |
| API Gateway | `services/api-gateway` | FastAPI (Python) |
| Orchestrator | `services/orchestrator` | TypeScript (`@jarvis/orchestrator`) |
| Memory | `services/memory-service` | TypeScript (`@jarvis/memory-service`) |
| Agents | `agents/` | Hermes, OpenClaw (Phase 2+) |
| Skills | `skills/` | Capability modules |
| Plugins | `plugins/` | Extension registry |
| Packages | `packages/` | types, logger, config, shared-utils |
| Database | `database/` | Schemas, migrations |
| Infrastructure | `infrastructure/` | Docker, deployment |
| Docs | `docs/` | Architecture and guides |
| Tests | `tests/` | Cross-cutting integration tests |

## Tech stack

- **Turborepo** — monorepo orchestration
- **TypeScript** — apps and packages (strict)
- **Next.js** — Jarvis web UI (user-facing only)
- **Electron** — Jarvis desktop shell
- **FastAPI** — API gateway layer
- **Docker** — local and deployment containers

## Packages

| Package | Purpose |
|---------|---------|
| `@jarvis/types` | Shared types and constants |
| `@jarvis/logger` | Logging interfaces |
| `@jarvis/config` | Configuration types |
| `@jarvis/shared-utils` | Utility helpers |

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Python ≥ 3.11 (for `services/api-gateway`, Phase 2+)
- Docker (optional, for `infrastructure/`)

## Quick start

```bash
npm install
npm run build
cp .env.example .env
```

See `services/api-gateway/README.md` and `infrastructure/README.md` for Python and Docker setup.

## Rules

- Frontend never calls OpenClaw directly.
- Hermes uses Jarvis Memory Service APIs for persistent memory.
- See `.cursor/rules/jarvis-os.mdc` for full project rules.

## License

Proprietary — Jarvis OS.
