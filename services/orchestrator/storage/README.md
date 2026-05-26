# orchestrator / storage

Task persistence abstraction (Phase 15).

Implementation lives in [`../src/storage/`](../src/storage/).

| Type | Role |
|------|------|
| `TaskStore` | Persistence contract |
| `InMemoryTaskStore` | Tests, ephemeral runs |
| `FileTaskStore` | CLI bridge dev store (JSON file) |
| `TaskStoreFactory` | Creates stores by kind |

Orchestrator services use `TaskStore` only — no direct `fs` imports outside this module.

Future database backends implement `TaskStore` without changing orchestrator execution code.
