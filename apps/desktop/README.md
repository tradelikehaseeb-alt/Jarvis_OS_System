# apps/desktop

Jarvis OS **desktop shell** — Electron main process.

## Phase 0

- Main process bootstrap only (empty window)
- No renderer business logic, no OpenClaw integration

## Phase 1+

- Load web UI from `ELECTRON_RENDERER_URL` or bundled `apps/web` build
- All automation via API → Orchestrator → OpenClaw gateway

```bash
npm run dev --workspace=@jarvis/desktop
```
