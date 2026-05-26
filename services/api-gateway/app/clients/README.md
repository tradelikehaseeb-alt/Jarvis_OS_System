# app/clients/

Internal clients for Jarvis backend services. API gateway talks to **orchestrator only** — never memory over HTTP.

## Orchestrator (Phase 7)

```
Controllers
    → OrchestratorClient (interface)
        → StubOrchestratorClient          [tests / CI]
        → LocalBridgeOrchestratorClient   [local dev]
              → OrchestratorTransport
                    → LocalCliTransport   [TEMPORARY: subprocess + tsx CLI]
                    → (future) HttpTransport | GrpcTransport | MessageQueueTransport
```

| Module | Role |
|--------|------|
| `orchestrator_client.py` | `OrchestratorClient` protocol |
| `stub_orchestrator_client.py` | Static in-process responses |
| `local_bridge_orchestrator_client.py` | Transport-backed client |
| `transport/local_cli.py` | Dev-only CLI bridge to `createOrchestratorService()` |
| `factory.py` | `get_orchestrator_client()` env resolution |

## Environment

`JARVIS_ORCHESTRATOR_CLIENT`: `stub` | `local_bridge` | `node` (alias)
