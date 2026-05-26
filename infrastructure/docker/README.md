# infrastructure/docker

Local development containers for Jarvis OS.

## Services (Phase 1)

- `postgres` — database
- `api-gateway` — FastAPI image (build context: `services/api-gateway`, Phase 2)
- `web` — Next.js image (build context: `apps/web`, Phase 2)
