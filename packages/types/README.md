# @jarvis/types

Shared TypeScript types and **Jarvis Core contracts** for the orchestrator and API gateway.

## Orchestrator contracts (Phase 2)

| Interface | Description |
|-----------|-------------|
| `UserTask` | User work unit from API gateway |
| `TaskIntent` | Declared intent behind a task |
| `TaskResult` | Orchestration outcome |
| `AgentRequest` | Orchestrator → agent dispatch |
| `AgentResponse` | Agent → orchestrator reply |
| `WorkflowStep` | Single workflow step |

## API gateway contracts (Phase 3)

| Interface | Description |
|-----------|-------------|
| `CreateTaskRequest` | `POST /tasks` body |
| `CreateTaskResponse` | Task creation response |
| `TaskStatusResponse` | Task status polling |
| `ConversationRequest` | Conversational turn input |
| `ConversationResponse` | Conversational turn output |
| `ApiErrorResponse` | Standard error envelope |

## Memory contracts (Phase 5)

| Interface | Description |
|-----------|-------------|
| `MemoryRecord` | Stored memory unit |
| `MemoryQuery` | Search input |
| `MemorySearchResult` | Ranked hit |
| `MemoryProvider` | store / get / search |
| `RetrievalRequest` | Retrieval engine input |
| `RetrievalResponse` | Retrieval engine output |

Interfaces only — no runtime logic. Import from `@jarvis/types`.

```bash
npm run test --workspace=@jarvis/types
```
