# tests/

Cross-cutting integration and end-to-end tests (not unit tests inside packages).

## Layout (Phase 2+)

| Path | Purpose |
|------|---------|
| `integration/` | API gateway + orchestrator flows |
| `e2e/` | UI → api-gateway smoke tests |

## Phase 0–1

Placeholder — unit tests live next to each package (`*.test.ts`).

## Constraints

- E2E must assert UI never bypasses API to reach agents
- Memory tests must use memory service APIs, not Hermes-local storage
