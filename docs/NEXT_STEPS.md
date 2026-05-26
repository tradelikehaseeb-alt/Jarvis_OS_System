# Jarvis OS — Next Steps (Planned Work)

Items below are **not implemented** as of Phase 15. Ordered by architectural dependency where possible.

---

## Immediate recommended phase

### Phase 16 — Real Hermes / OpenClaw adapters

**Scope:** Official integration adapters only — no copied third-party code.

| Adapter | Responsibility | Constraints |
|---------|----------------|-------------|
| **Hermes adapter** | LLM/reasoning via supported official APIs | Memory still via Memory Service only |
| **OpenClaw adapter** | Execution gateway via official OpenClaw integration | Sandbox + permissions; UI never calls OpenClaw |

**Suggested deliverables:**

- `agents/hermes-adapter/` or adapter module behind `HermesAgent` interface
- `agents/openclaw-adapter/` behind `OpenClawAgent` interface
- Feature flags to fall back to stub mode for CI
- Contract tests proving adapter swap does not break `SkillExecutor` pipeline

See [../RESUME_POINT.md](../RESUME_POINT.md).

---

## Platform and infrastructure

| Item | Description | Depends on |
|------|-------------|------------|
| **Production orchestrator transport** | HTTP/gRPC/message queue replacing `LocalCliTransport` | Phase 16+ stable agents |
| **Memory persistence** | HTTP API for `@jarvis/memory-service`; real storage adapter | Database choice |
| **Database** | PostgreSQL (or chosen store) for tasks, users, memory | `TaskStore` DB implementation |
| **`TaskStore` DB backend** | Implement `TaskStore` for SQL — no orchestrator logic change | Phase 15 abstraction |
| **Authentication** | API gateway auth middleware, identity on `UserTask` | Database, tenancy model |
| **Production deployment** | K8s/Docker compose, env config, health checks | Transport + DB + auth |

---

## Product and UX

| Item | Description |
|------|-------------|
| **Electron UI** | Feature-complete desktop shell wired to API gateway only |
| **Web UI** | Task creation, status, conversation surfaces in `apps/web` |
| **STT** | Speech-to-text input path into API/conversation |
| **TTS** | Text-to-speech output for responses |
| **Voice routing** | Route voice intents through orchestrator (same as text tasks) |

---

## Platform extensions

| Item | Description |
|------|-------------|
| **Plugins registry** | Load third-party capabilities via `plugins/` host |
| **SaaS billing** | Tenants, subscriptions, usage metering |
| **Multi-tenancy** | Tenant isolation on tasks, memory, agents |

---

## Quality and operations

| Item | Description |
|------|-------------|
| **Observability** | Structured logging (`@jarvis/logger`), tracing, metrics |
| **Security hardening** | Secrets management, rate limits, audit logs |
| **E2E test suite** | Cross-service tests with testcontainers (API + orchestrator + DB) |
| **CI pipeline** | npm + pytest + turbo in GitHub Actions |

---

## Explicit non-goals (until specified)

- Copying Hermes or OpenClaw source into the monorepo
- Frontend → OpenClaw direct calls
- Hermes writing persistent memory outside Memory Service
- Redis/PostgreSQL in Phase 16 (adapters only per resume point)

---

## Phase roadmap alignment

| Phase (docs/PHASES.md) | Topic | This document |
|------------------------|-------|---------------|
| 16 (recommended) | Hermes/OpenClaw adapters | **Start here** |
| 16–17 (alt.) | Transport + Memory HTTP | Platform section |
| 17+ | Plugins, SaaS, hardening | Platform extensions |

Update `docs/PHASES.md` when Phase 16 scope is officially renumbered to match adapter work.

---

## Success criteria (high level)

1. User completes a real task from Jarvis UI through API → orchestrator → official Hermes/OpenClaw → skill.
2. Task and conversation state survive process restarts (DB-backed `TaskStore`).
3. Memory retrievable across sessions via Memory Service HTTP.
4. Deployable single-tenant or multi-tenant stack with auth.
