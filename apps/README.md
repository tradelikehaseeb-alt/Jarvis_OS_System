# apps/

**Layer:** UI — the only surface users see (Jarvis branding).

| App | Path | Purpose |
|-----|------|---------|
| Web | `web/` | Next.js — Jarvis web client (scaffold) |
| Desktop | `desktop/` | Electron — command center + voice-native UI |

**Current desktop:** Phase **92** — see [`desktop/README.md`](desktop/README.md).

## Constraints

- Call **services/api-gateway** over HTTP only.
- Must **not** import from `agents/`, `skills/openclaw`, or OpenClaw SDKs.
- Voice uses `@jarvis/speech-service` in renderer, then API for task execution.
- Shared UI logic lives in `packages/`, not duplicated across apps.

## Documentation

| Doc | Purpose |
|-----|---------|
| [`../docs/SETUP.md`](../docs/SETUP.md) | Install and run |
| [`../docs/VOICE.md`](../docs/VOICE.md) | Voice capabilities |
| [`../docs/screenshots/README.md`](../docs/screenshots/README.md) | UI capture guide |
