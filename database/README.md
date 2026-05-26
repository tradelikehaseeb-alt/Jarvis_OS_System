# database/

Schemas, migrations, and seed data for Jarvis OS persistence.

## Layout

| Path | Purpose |
|------|---------|
| `migrations/` | Versioned SQL migrations |
| `schemas/` | Reference DDL and diagrams (Phase 1+) |

## Phase 0

Empty structure — connect via `DATABASE_URL` in `.env.example`.

## Ownership

- User memory storage is owned by **services/memory-service**, not `agents/hermes`
- Application data tables defined here, applied by migration tooling in Phase 1
