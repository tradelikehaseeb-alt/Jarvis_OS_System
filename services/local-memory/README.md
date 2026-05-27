# @jarvis/local-memory

Local memory persistence for Jarvis OS (Phase 62). **Canonical persistence layer** for orchestrator conversation and memory records (Phase 67).

## Flow

```
executeCreateTask()
  → MemoryPersistenceManager → LocalMemoryBackedMemoryStore
  → LocalMemoryRuntime → LocalMemoryRepository → file (SQLite-ready JSON)

ConversationHistoryRuntime → same LocalMemoryRuntime (shared instance)
```

## Exports

| Symbol | Role |
|--------|------|
| `LocalMemoryRecord` | Persisted record shape with `schemaVersion` |
| `LocalMemorySession` | Active session metadata |
| `LocalMemoryHealth` | Runtime health snapshot |
| `LocalMemoryRuntime` | `saveMemory`, `getMemory`, `queryMemory`, `deleteMemory`, `getHealth` |
| `LocalMemoryRepository` | Storage contract |
| `createDefaultLocalMemoryRuntime()` | Factory (file backend by default) |

## Backends

- **File** (`FileLocalMemoryRepository`) — JSON store with `sqliteReady: true` for future SQLite migration
- **In-memory** (`InMemoryLocalMemoryRepository`) — fallback when `useFileBackend: false`

## Usage

```typescript
import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

const runtime = createDefaultLocalMemoryRuntime({ filePath: "/path/to/local-memory.json" });
runtime.saveMemory({ /* LocalMemoryRecord */ });
const history = runtime.queryMemory({ userId: "user-1" });
```

Orchestrator wiring (default — in-memory):

```typescript
import { createDefaultMemoryPersistenceManager } from "@jarvis/orchestrator";

const memory = createDefaultMemoryPersistenceManager();
```

File-backed or shared runtime:

```typescript
import { createLocalBackedMemoryPersistenceManager } from "@jarvis/orchestrator";
import { createDefaultLocalMemoryRuntime } from "@jarvis/local-memory";

const runtime = createDefaultLocalMemoryRuntime({ filePath: "/path/to/local-memory.json" });
const memory = createLocalBackedMemoryPersistenceManager(undefined, undefined, { runtime });
```

Pass the same `runtime` to `createDefaultContextRuntimeBundle({ localMemoryRuntime: runtime })` when wiring conversation history separately.
