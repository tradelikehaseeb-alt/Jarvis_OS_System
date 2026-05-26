# infrastructure/

Docker, compose stacks, and deployment configuration.

## Layout

| Path | Purpose |
|------|---------|
| `docker/` | Dockerfiles and `docker-compose.yml` |

## Phase 1

Compose file wires Postgres; `api-gateway` and `web` services commented until Phase 2.

```bash
cd infrastructure/docker
docker compose --env-file ../../.env up -d
```
