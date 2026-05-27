# @jarvis/orchestrator

Jarvis Core **orchestrator** — workflow composition, capability routing, and task execution.

## Phase 45 — execution lifecycle

```
Orchestrator → HermesGateway → Plan → OpenClawGateway → Execution Lifecycle → Activity Stream
```

| Export | Role |
|--------|------|
| `ExecutionLifecycleManager` | Session state + activity streaming |
| `InMemoryExecutionLifecycleManager` | In-memory lifecycle + internal subscribers |
| `createDefaultExecutionLifecycleManager()` | Factory |
| `emitHermesPlanningActivities()` | Planning activity from Hermes payload |
| `emitOpenClawExecutionActivities()` | Execution activity from OpenClaw payload |

Execution states: `queued`, `planning`, `executing`, `waiting`, `completed`, `failed`, `cancelled`.

Automate intents run Hermes planning handshake → OpenClaw execution. Task output includes `executionLifecycle` snapshot.

## Phase 46 — memory persistence

```
Execution Lifecycle → MemoryPersistenceManager → InMemoryMemoryStore → History / Summary
```

| Export | Role |
|--------|------|
| `MemoryStore` / `InMemoryMemoryStore` | Record storage |
| `MemoryPersistenceManager` | Conversation + execution persistence |
| `createDefaultMemoryPersistenceManager()` | Factory |

Memory types: `conversation`, `execution`, `activity`, `summary`.

Task execution automatically stores lifecycle events, conversation turns, and generates deterministic summaries. In-memory only (no DB).

## Phase 47 — real-time event streaming

```
Execution Lifecycle / Memory → StreamManager → Subscribers
```

| Export | Role |
|--------|------|
| `StreamManager` / `InMemoryStreamManager` | In-memory pub/sub |
| `createDefaultStreamManager()` | Factory |
| `attachExecutionStream()` | Lifecycle → stream bridge |

Event types: `execution_started`, `planning_started`, `planning_completed`, `execution_completed`, `memory_saved`, `conversation_updated`, `failed`.

No WebSockets yet — internal subscribers only.

## Phase 51 — storage runtime

```
MemoryPersistenceManager → StorageBackedMemoryStore → StorageRuntime → StorageProvider
```

| Export | Role |
|--------|------|
| `StorageRuntime` | Pluggable save/get/query/delete boundary |
| `InMemoryStorageProvider` | Default in-memory backend |
| `FileStorageProvider` | JSON file persistence |
| `createDefaultStorageRuntime()` | In-memory default factory |
| `createFileBackedMemoryPersistenceManager()` | File-backed memory option |

See `src/storage-runtime/README.md`.

## Phase 50 — end-to-end execution flow

```
Chat/Voice Input → Speech Normalization → Intent → Orchestrator → Lifecycle → Memory → Stream → UI Projection
```

| Export | Role |
|--------|------|
| `JarvisExecutionFlow` | `executeFlow()` + `getExecutionSummary()` |
| `createDefaultJarvisExecutionFlow()` | Full chain with speech + intent + orchestrator |
| `JarvisExecutionFlowResult` | Steps, stream events, task record, UI projection |

See `src/e2e/README.md`.

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
| `execution/` | **Phase 45** — lifecycle + activity streaming |
| `memory/` | **Phase 46** — execution + conversation memory |
| `streaming/` | **Phase 47** — real-time event stream |
| `execution-manager/` | Step lifecycle (stub) |
| `context-manager/` | Session context |
| `workflow-manager/` | Build workflows |
| `agent-registry/` | Agent catalog (stub or live) |

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator
```
