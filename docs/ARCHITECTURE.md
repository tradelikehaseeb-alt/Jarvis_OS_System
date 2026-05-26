# Jarvis OS Architecture

## Layer model

```
UI → API Gateway → Orchestrator → Agents → Skills
```

| Layer | Repository path | Technology |
|-------|-----------------|------------|
| UI | `apps/web`, `apps/desktop` | Next.js, Electron |
| API Gateway | `services/api-gateway` | FastAPI |
| Orchestrator | `services/orchestrator` | TypeScript (`@jarvis/orchestrator`) |
| Agents | `agents/hermes`, `agents/openclaw` | TBD |
| Skills | `skills/` | Modules |
| Plugins | `plugins/` | Extension host |
| Types | `packages/types` | TypeScript |
| Logger | `packages/logger` | TypeScript |
| Config | `packages/config` | TypeScript |
| Shared utils | `packages/shared-utils` | TypeScript |
| Memory | `services/memory-service` | TypeScript (`@jarvis/memory-service`) |
| Data | `database/` | PostgreSQL |

## Agent roles

- **Hermes** — planning, reasoning, memory access, task decomposition
- **OpenClaw** — browser/desktop automation, execution (sandboxed)

## Memory ownership

- **Jarvis Memory Service** (`services/memory-service`) owns persistent memory
- Hermes reads/writes through memory APIs only
- Hermes must not directly store persistent memory

## Non-negotiable rules

1. User only sees Jarvis UI
2. Frontend never calls OpenClaw
3. No duplicate code — use `packages/types` and `packages/shared-utils`
4. Scan repo before creating files
5. TypeScript strict; tests per module
6. Production-ready, modular, SOLID-friendly design
7. OpenClaw execution requires permission checks and sandbox boundaries

## Phase 12 — Capability routing (current)

`CapabilityRouter` matches `TaskIntent` to agent registry metadata → `RoutingDecision`. Deterministic stub policy only.

## Phase 11 — Agent→skill pipeline

`SkillExecutor` → `SkillRegistry` only. `AgentSkillBinding` registry.

## Phase 10 — Agent stubs

`@jarvis/hermes`, `@jarvis/openclaw`, `@jarvis/agents-bootstrap`.

## Phase 9 — Skills framework

`skills/shared` (`@jarvis/skills-shared`): `BaseSkill`, `SkillRegistry`, etc.

## Phase 8 — Agent framework

`agents/shared` (`@jarvis/agents-shared`): `BaseAgent`, `InMemoryAgentRegistry`, contracts.

## Phase 7 — Orchestrator transport

Controllers → `OrchestratorClient` → `LocalBridgeOrchestratorClient` → `LocalCliTransport` (temp dev CLI).
Future: HTTP/gRPC/message queue. **No** memory HTTP.

## Phase 6 — API gateway → orchestrator

`POST /tasks`, `GET /tasks/{taskId}`, `POST /conversations` → controllers → orchestrator stubs.

## Phase 5 — Memory service

`@jarvis/memory-service`: `memory-provider`, `retrieval-engine`, `embedding-provider`, `storage-adapter`, `memory-api` (in-memory stubs).

**Contracts** (`@jarvis/types`): `MemoryRecord`, `MemoryQuery`, `MemorySearchResult`, `MemoryProvider`, `RetrievalRequest`, `RetrievalResponse`.

## Phase 4 — Orchestrator stubs

`@jarvis/orchestrator`: `TaskRouterStub`, `ExecutionManagerStub`, `ContextManagerStub`, `WorkflowManagerStub`, `AgentRegistryStub`, `OrchestratorServiceStub` — mock/static wiring only.

## Phase 3 — API gateway

**HTTP contracts** (`@jarvis/types`): `CreateTaskRequest`, `CreateTaskResponse`, `TaskStatusResponse`, `ConversationRequest`, `ConversationResponse`, `ApiErrorResponse`.

**api-gateway layout**: `routes`, `controllers`, `schemas`, `middleware`, `validators`, `error_handling` (handlers in Phase 5).

## Phase 2 — Jarvis Core

**Contracts** (`@jarvis/types`): `UserTask`, `TaskIntent`, `TaskResult`, `AgentRequest`, `AgentResponse`, `WorkflowStep`.

**Orchestrator modules**: `task-router`, `execution-manager`, `context-manager`, `workflow-manager`, `agent-registry` (interfaces only).

## Phase 1 refactor

- `services/api` → `services/api-gateway`
- `services/memory` → `services/memory-service`
- `packages/shared` → `types`, `logger`, `config`, `shared-utils`
