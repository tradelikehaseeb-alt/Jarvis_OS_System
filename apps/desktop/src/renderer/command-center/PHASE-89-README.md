# Phase 89 — Jarvis Command Center UI

**Updated Phase 92:** execution panel uses Framer Motion progress + completion label (`All set`).

## Components

| Component | Purpose |
|-----------|---------|
| `JarvisCommandCenter` | Primary command surface (replaces chat dashboard layout) |
| `AIStatusOrb` | Visual activity heartbeat (legacy when `voiceNativeUi: false`) |
| `DynamicActivityPanel` | Shows **only active** capabilities during execution |
| `LiveExecutionPanel` | Real-time progress rail + progressive streaming (Phase 92) |
| `MinimalSidebar` | Futuristic minimal navigation |
| `FloatingCommandInput` | Glassmorphism command composer |

## User-facing copy

Internal agent names are never shown. Examples:

- "Understanding request…" (planning)
- "Performing task…" (execution)
- "Working" / "All set" / "Done" (Phase 92 execution states)

Labels: `command-center/execution-display-labels.ts`, `activity/activity-event.ts`.

## Tests

```bash
npm run test --workspace=@jarvis/desktop -- --run src/renderer/command-center
```

## Styling

- `styles/command-center.css` — glassmorphism, orb animations, minimal sidebar
- `styles/polish.css` — Phase 92 spacing, typography, glow (imported in `main.tsx`)

## Docs

- [`../../../../docs/VOICE.md`](../../../../docs/VOICE.md)
- [`../../../../docs/screenshots/README.md`](../../../../docs/screenshots/README.md)
