# Jarvis OS — Next Steps (Planned Work)

Items below are **not fully implemented** as of **Phase 92**. Completed items are marked ✅.

---

## Completed since Phase 15 ✅

| Item | Phase |
|------|-------|
| LLM multi-provider connectors + Settings UI | 82–83 |
| Real provider validation + streaming | 88–89 |
| Command Center desktop UI | 89 |
| Voice-native UI (orb, overlay, interrupt) | 90 |
| Real-time mic + STT/TTS adapters | 91 |
| UX polish (motion, latency, performance) | 92 |
| Voice → API → orchestrator execution chain | 72 |
| Activity stream, timeline, runtime health | 71–75 |

---

## Immediate recommended phase

### Phase 93+ — Production platform

**Scope:** Production-ready deployment path.

| Workstream | Goal |
|------------|------|
| **Orchestrator transport** | HTTP/gRPC client replacing `LocalCliTransport` |
| **Auth & tenancy** | API gateway identity, scoped tasks |
| **Database TaskStore** | PostgreSQL behind existing interface |
| **Web UI** | Parity with desktop task/voice surfaces |

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

| Item | Description | Status |
|------|-------------|--------|
| **Electron UI** | Command center, voice-native, providers | ✅ Phases 89–92 |
| **STT / TTS** | Streaming adapters + browser mic | ✅ Phase 91 |
| **Voice routing** | Voice → intent → orchestrator | ✅ Phase 72 |
| **Web UI** | Task creation, status, conversation in `apps/web` | Planned |
| **UI screenshot assets** | Committed PNG/GIF per `docs/screenshots/` | Planned |

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
