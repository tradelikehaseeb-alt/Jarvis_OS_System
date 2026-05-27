# @jarvis/local-memory

Local memory persistence for Jarvis OS (Phase 62).

## Flow

```
Orchestrator → MemoryPersistenceManager → LocalMemoryBackedMemoryStore
  → LocalMemoryRuntime → LocalMemoryRepository → file (SQLite-ready JSON)
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

Orchestrator wiring:

```typescript
import { createLocalBackedMemoryPersistenceManager } from "@jarvis/orchestrator";

const memory = createLocalBackedMemoryPersistenceManager("/path/to/local-memory.json");
```

Default in-memory orchestrator behavior is unchanged via `createDefaultMemoryPersistenceManager()`.
