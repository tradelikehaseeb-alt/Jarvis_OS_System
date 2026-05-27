# Storage runtime (Phase 51)

Pluggable persistence boundary beneath orchestrator memory and future modules.

```
Orchestrator → MemoryPersistenceManager → MemoryStore → StorageRuntime → StorageProvider
```

## Exports

| Export | Role |
|--------|------|
| `StorageProvider` | `save`, `get`, `query`, `delete`, `getHealth` |
| `StorageRecord` | Generic persisted record (`id`, `namespace`, `data`, `metadata`) |
| `StorageQuery` | Namespace + metadata filters |
| `StorageHealth` | Provider health snapshot |
| `StorageRuntime` | Facade over `StorageProviderRegistry` |
| `InMemoryStorageProvider` | Default in-memory backend |
| `FileStorageProvider` | JSON file persistence |
| `StorageProviderRegistry` | Register and resolve providers |
| `createDefaultStorageRuntime()` | In-memory default |
| `createFileStorageRuntime(path)` | File-backed default |

## Memory integration

`StorageBackedMemoryStore` implements `MemoryStore` using `StorageRuntime`.
`createDefaultMemoryPersistenceManager()` uses in-memory storage runtime by default.
`createFileBackedMemoryPersistenceManager(path)` enables file persistence.

## Constraints

- No database dependency
- Existing APIs unchanged
- In-memory flow remains default
- Desktop, Hermes, OpenClaw, and speech-service unchanged
