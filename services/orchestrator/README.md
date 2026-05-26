# @jarvis/orchestrator

Jarvis Core **orchestrator** — workflow composition, capability routing, and task execution.

## Phase 14 — end-to-end task lifecycle

```
POST /tasks (api-gateway)
  → OrchestratorServiceImpl.executeCreateTask()
    → TaskRouter → ContextManager → WorkflowManager
    → CapabilityRouter → AgentRegistry (live metadata)
    → Agent.execute() → SkillExecutor → Skill
  → TaskStore (InMemoryTaskStore | FileTaskStore via TaskStoreFactory)
```

| Export | Role |
|--------|------|
| `createDefaultOrchestratorService()` | Live agents + skills + shared file store |
| `createTestOrchestratorService()` | In-memory store for unit tests |
| `executeCreateTask()` | Full create-task pipeline |
| `LiveAgentRegistry` | Maps `@jarvis/agents-bootstrap` metadata |

## Storage (Phase 15)

| Type | Role |
|------|------|
| `TaskStore` | Persistence interface |
| `InMemoryTaskStore` | Tests / ephemeral |
| `FileTaskStore` | CLI bridge JSON file |
| `TaskStoreFactory` | `create({ kind })`, `getSharedDefault()` |

See [`storage/README.md`](./storage/README.md).

Static/mock only — no LLM, database, or external APIs.

## Modules

| Module | Role |
|--------|------|
| `task-router/` | Route `UserTask` → workflow |
| `capability-routing/` | Intent → agent selection |
| `task-execution/` | **Phase 14** — create + status store |
| `execution-manager/` | Step lifecycle (stub) |
| `context-manager/` | Session context |
| `workflow-manager/` | Build workflows |
| `agent-registry/` | Agent catalog (stub or live) |

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator
```
