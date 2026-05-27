# Desktop API client (Phase 54)

Renderer → IPC → embedded `@jarvis/api-runtime` → orchestrator.

```
ChatPage → submitChatAsTask()
  → checkApiHealth()
  → createTask (POST /tasks)
  → getTaskStatus (GET /tasks/:id)
  → activity timeline + agent status
```

## Modules

| Module | Role |
|--------|------|
| `jarvis-client.ts` | IPC bridge helpers + `submitChatAsTask` |
| `api-request-lifecycle.ts` | Request state machine types |
| `api-communication.ts` | Health checks, error parsing, lifecycle helpers |

## Main process

Embedded API runtime starts on app ready (`src/ipc/api-runtime-lifecycle.ts`) unless `JARVIS_API_URL` is set.

| Env | Behavior |
|-----|----------|
| `JARVIS_API_URL` | Use external API base URL |
| `JARVIS_USE_EMBEDDED_API_RUNTIME=false` | Skip embedded server |
| `JARVIS_API_RUNTIME_PORT` | Embedded port (default `8787`) |

IPC handlers retry transient failures and parse API error envelopes.
