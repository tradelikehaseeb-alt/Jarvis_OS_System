# @jarvis/memory-service

**Jarvis Memory Service** — sole owner of persistent user memory (Phase 5 skeleton).

Hermes and other agents must use memory **HTTP APIs** (Phase 6+) — never store `MemoryRecord` locally.

## Modules

| Module | Stub | Role |
|--------|------|------|
| `storage-adapter/` | `StorageAdapterStub` | In-memory record port (not vector DB) |
| `embedding-provider/` | `EmbeddingProviderStub` | Static `[0,0,0]` vector — no model |
| `memory-provider/` | `MemoryProviderStub` | Implements `@jarvis/types` `MemoryProvider` |
| `retrieval-engine/` | `RetrievalEngineStub` | Lists user records — no semantic search |
| `memory-api/` | `MemoryApiServiceStub` | Unified `store` / `search` / `retrieve` |

## Contracts (`@jarvis/types`)

`MemoryRecord`, `MemoryQuery`, `MemorySearchResult`, `MemoryProvider`, `RetrievalRequest`, `RetrievalResponse`

## Wiring

```typescript
import { createMemoryService } from "@jarvis/memory-service";

const memory = createMemoryService();
await memory.store({ userId: "u1", content: "note" });
```

## Phase 5

Interfaces + in-memory stubs only. No vector DB, embeddings models, or Hermes/OpenClaw.

```bash
npm run test --workspace=@jarvis/memory-service
npm run build --workspace=@jarvis/memory-service
```
