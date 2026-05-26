# services/api-gateway

Jarvis OS **API gateway** — FastAPI HTTP boundary: **UI → api-gateway → orchestrator → agents → skills**.

## Phase 14 (current)

End-to-end `POST /tasks` lifecycle with static skill responses:

| Route | Method | Flow |
|-------|--------|------|
| `/tasks` | POST | Validate → `TasksController` → orchestrator → agent → skill → `completed` |
| `/tasks/{taskId}` | GET | Stored task status + skill output |
| `/conversations` | POST | Stub reply (unchanged) |

### Validation

- Non-empty `intent.kind` and `intent.description`
- Allowed kinds: `automate`, `plan`, `research`, `draft`, `default`
- Max description length: 4096

### Orchestrator clients

| Client | Transport | Use |
|--------|-----------|-----|
| `StubOrchestratorClient` | none (in-process) | tests, CI — simulates full Phase 14 flow |
| `LocalBridgeOrchestratorClient` | `LocalCliTransport` | local dev → `orchestrator-bridge/cli.ts` |

Task store for CLI bridge: `services/api-gateway/.jarvis-task-store/tasks.json` (gitignored).

## Layout

```
app/
├── routes/           # POST/GET handlers
├── controllers/      # Delegate to OrchestratorClient
├── clients/          # OrchestratorClient + transport/
├── schemas/          # Pydantic ↔ @jarvis/types
├── validators/
├── middleware/       # request_id
└── error_handling/
orchestrator-bridge/
└── cli.ts            # tsx → createDefaultOrchestratorService()
```

## Run

```bash
# Tests (stub client — no Node)
cd services/api-gateway
pip install -r requirements.txt
set JARVIS_ORCHESTRATOR_CLIENT=stub
pytest

# Dev server (Node bridge for live orchestrator + agents)
cd ../..
npm install
cd services/api-gateway
set JARVIS_ORCHESTRATOR_CLIENT=local_bridge
uvicorn app.main:app --reload --port 8000
```

## Environment

| Variable | Values | Default |
|----------|--------|---------|
| `JARVIS_ORCHESTRATOR_CLIENT` | `stub` \| `local_bridge` \| `node` | `local_bridge` |
