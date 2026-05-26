# Jarvis OS — Project Status

**Checkpoint date:** May 2026  
**Current phase:** 15 complete  
**Monorepo:** `jarvis-os` (Turborepo, npm workspaces)

---

## Executive summary

Jarvis OS is a production-oriented AI operating system monorepo with a strict layered architecture. Phases **0 through 15** are complete. The system supports an end-to-end **mock/static** task lifecycle from `POST /tasks` through capability routing, agent execution, skill dispatch, and task persistence — with no authentication, database, LLM, or real automation yet.

The codebase is **framework-ready** and **integration-pending** for real Hermes, OpenClaw, memory persistence, and production infrastructure.

---

## Completed phases (0–15)

| Phase | Status | One-line outcome |
|-------|--------|------------------|
| 0 | Done | Monorepo scaffold, Docker, docs, apps/services layout |
| 1 | Done | Renamed api-gateway, memory-service, split packages |
| 2 | Done | Jarvis Core contracts + orchestrator module skeleton |
| 3 | Done | API gateway structure (routes, schemas, validators) |
| 4 | Done | Orchestrator stub components wired internally |
| 5 | Done | Memory service contracts + in-memory stubs |
| 6 | Done | API routes → orchestrator (POST/GET tasks, conversations) |
| 7 | Done | Orchestrator transport abstraction (LocalCli bridge) |
| 8 | Done | Agent framework (`@jarvis/agents-shared`) |
| 9 | Done | Skills framework (`@jarvis/skills-shared`) |
| 10 | Done | Hermes + OpenClaw agent stubs |
| 11 | Done | Agent→skill pipeline (`SkillExecutor`) |
| 12 | Done | Capability-based orchestrator routing |
| 13 | Done | Concrete skills (search, file, browser) + bindings |
| 14 | Done | End-to-end API → orchestrator → agent → skill |
| 15 | Done | `TaskStore` storage abstraction (memory + file) |

See [COMPLETED_PHASES.md](./COMPLETED_PHASES.md) for full detail per phase.

---

## Current architecture (enforced)

```
UI (apps) → API Gateway → Orchestrator → Agents → Skills
```

| Rule | Status |
|------|--------|
| User only sees Jarvis UI | Enforced by design |
| Frontend never calls OpenClaw | Enforced |
| Hermes memory via Memory Service APIs only | Contract + docs; HTTP memory not wired |
| Orchestrator selects agents; agents call skills via `SkillExecutor` | Implemented (static) |
| No duplicate frameworks | Shared packages reused |

---

## Implemented modules

### Applications (`apps/`)

| Path | Package / app | State |
|------|---------------|-------|
| `apps/web` | Next.js web UI | Scaffold |
| `apps/desktop` | Electron shell | Scaffold |

### Services (`services/`)

| Path | Name | State |
|------|------|-------|
| `services/api-gateway` | FastAPI HTTP boundary | Routes, controllers, validation, error envelope, orchestrator clients |
| `services/orchestrator` | `@jarvis/orchestrator` | Stubs + live task execution + capability routing + storage |
| `services/memory-service` | `@jarvis/memory-service` | Contracts + in-memory stubs only |

### Agents (`agents/`)

| Package | Role | State |
|---------|------|-------|
| `@jarvis/agents-shared` | `BaseAgent`, `SkillExecutor`, bindings, pipeline | Production framework |
| `@jarvis/hermes` | Planner agent | Stub → `SearchSkill` |
| `@jarvis/openclaw` | Execution gateway | Stub → `BrowserSkill`, `FileSkill` |
| `@jarvis/agents-bootstrap` | Default registration | Wired |

### Skills (`skills/`)

| Package | Skill ID | Bound agent |
|---------|----------|-------------|
| `@jarvis/skills-shared` | Framework | — |
| `@jarvis/search-skill` | `search-skill` | Hermes |
| `@jarvis/file-skill` | `file-skill` | OpenClaw |
| `@jarvis/browser-skill` | `browser-skill` | OpenClaw |

### Shared packages (`packages/`)

| Package | Purpose |
|---------|---------|
| `@jarvis/types` | Core + API + memory contracts |
| `@jarvis/logger` | Logging interfaces |
| `@jarvis/config` | Configuration types |
| `@jarvis/shared-utils` | Utilities |

### Other areas

| Path | State |
|------|-------|
| `plugins/` | Scaffold / registry placeholder |
| `database/` | Schema/migration placeholders |
| `infrastructure/` | Docker + deployment scaffold |
| `tests/` | Cross-cutting test placeholder |

---

## Active npm workspaces

From root `package.json`:

- `apps/*`
- `packages/*`
- `services/orchestrator`
- `services/memory-service`
- `services/api-gateway` (Python; not npm workspace — separate `requirements.txt`)
- `agents/shared`, `agents/hermes`, `agents/openclaw`, `agents/bootstrap`
- `skills/shared`, `skills/search-skill`, `skills/file-skill`, `skills/browser-skill`

---

## Runtime flows (current behavior)

All flows below use **static/mock** data unless noted.

### API flow

1. `POST /tasks` → `TasksController` → validation → `OrchestratorClient`
2. Stub client (tests) or `LocalBridgeOrchestratorClient` (dev) → Node `orchestrator-bridge/cli.ts`
3. Response: `CreateTaskResponse` with `status: completed` (stub path)
4. `GET /tasks/{taskId}` → stored task status + skill output in `output`

### Orchestrator flow

1. `OrchestratorServiceImpl.executeCreateTask()`
2. `TaskRouter` → `ContextManager` → `WorkflowManager`
3. `CapabilityRouter` → `LiveAgentRegistry` (metadata)
4. Resolve executable agent → `agent.execute()`
5. Agent uses `SkillExecutor` → `SkillRegistry` → concrete skill
6. `TaskStore.save()` → `CreateTaskResponse` + `TaskStatusResponse`

### Storage flow

- **Tests:** `InMemoryTaskStore` via `TaskStoreFactory.createInMemory()`
- **Default / CLI bridge:** `FileTaskStore` (JSON at `services/api-gateway/.jarvis-task-store/tasks.json`)
- **Interface:** `TaskStore` — ready for future DB/Redis backends (not implemented)

### Agent → skill bindings

| Agent | Skills |
|-------|--------|
| `hermes` | `search-skill` |
| `openclaw-gateway` | `browser-skill`, `file-skill` |

---

## What is NOT implemented yet

- Real Hermes (LLM / official adapter)
- Real OpenClaw (automation / official adapter)
- Memory HTTP API and persistence
- SQL/NoSQL `TaskStore` backend
- Authentication / multi-tenancy
- Production orchestrator transport (HTTP/gRPC/MQ)
- Electron feature UI, STT/TTS, voice routing
- Plugins runtime, SaaS billing, production deployment

See [NEXT_STEPS.md](./NEXT_STEPS.md).

---

## Verification commands

```bash
# TypeScript workspaces
npm install
npm run test --workspace=@jarvis/orchestrator
npm run test --workspace=@jarvis/agents-shared
npm run test --workspace=@jarvis/search-skill

# API gateway (stub orchestrator — no Node required)
cd services/api-gateway
pip install -r requirements.txt
set JARVIS_ORCHESTRATOR_CLIENT=stub   # Windows
pytest
```

---

## Related documents

| Document | Purpose |
|----------|---------|
| [COMPLETED_PHASES.md](./COMPLETED_PHASES.md) | Phase-by-phase delivery log |
| [ARCHITECTURE_SNAPSHOT.md](./ARCHITECTURE_SNAPSHOT.md) | Diagrams and layer detail |
| [NEXT_STEPS.md](./NEXT_STEPS.md) | Planned work |
| [PHASES.md](./PHASES.md) | Official phase table |
| [../RESUME_POINT.md](../RESUME_POINT.md) | Restart guide + recommended next phase |
