# apps/

**Layer:** UI — the only surface users see (Jarvis branding).

| App | Path | Purpose |
|-----|------|---------|
| Web | `web/` | Next.js — primary Jarvis web client |
| Desktop | `desktop/` | Electron — Jarvis desktop shell |

## Constraints

- May call **services/api-gateway** over HTTP only.
- Must **not** import from `agents/`, `skills/openclaw`, or OpenClaw SDKs.
- Shared UI logic lives in `packages/`, not duplicated across apps.

## Phase 18 — Desktop UI

`apps/desktop` — Electron + React shell with Chat wired to `POST /tasks` and Hermes plan rendering (Phase 23). See `apps/desktop/README.md`.

## Constraints (all phases)

No OpenClaw/Hermes direct imports. HTTP to api-gateway only.
