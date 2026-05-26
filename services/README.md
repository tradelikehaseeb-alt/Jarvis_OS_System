# services/

**Layer:** API and backend microservices — HTTP boundary between UI and orchestration.

| Service | Path | Stack | Phase |
|---------|------|-------|-------|
| API Gateway | `api-gateway/` | FastAPI | 0–1 (config), 3 (routes) |
| Orchestrator | `orchestrator/` | TypeScript (`@jarvis/orchestrator`) | **4** (stubs), 5 (API wire) |
| Memory | `memory-service/` | TypeScript (`@jarvis/memory-service`) | **5** (stubs), 6 (HTTP) |

## Flow

```
apps (UI) → services/api-gateway → orchestrator → agents → skills
```

## Constraints

- UI never skips this layer to reach `agents/` or OpenClaw.
- Persistent memory owned by **memory-service** — Hermes uses memory APIs only.
