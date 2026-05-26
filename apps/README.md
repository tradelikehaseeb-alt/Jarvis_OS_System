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

## Phase 0

Configuration and minimal shell only — no business logic.
