# Phase 89 — Jarvis Command Center UI

## Components

| Component | Purpose |
|-----------|---------|
| `JarvisCommandCenter` | Primary command surface (replaces chat dashboard layout) |
| `AIStatusOrb` | Visual activity heartbeat + provider/latency indicator |
| `DynamicActivityPanel` | Shows **only active** capabilities during execution |
| `LiveExecutionPanel` | Real-time progress rail with streaming hint |
| `MinimalSidebar` | Futuristic minimal navigation |
| `FloatingCommandInput` | Glassmorphism command composer |

## User-facing copy

Internal agent names are never shown. Examples:

- "Understanding request…" (was Hermes planning)
- "Performing task…" (was OpenClaw execution)

Labels live in `command-center/execution-display-labels.ts` and `activity/activity-event.ts`.

## Tests

```bash
npm run test --workspace=@jarvis/desktop -- --run src/renderer/command-center
```

## Styling

`styles/command-center.css` — glassmorphism, orb animations, minimal sidebar.
