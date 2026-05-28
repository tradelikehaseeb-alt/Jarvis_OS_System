# Jarvis Execution Runtime

Phase 95 adds real browser and desktop execution capabilities through the orchestrator → OpenClaw path.

## Architecture

```
Voice / Chat UI → API → Orchestrator → WorkflowExecutionEngine → OpenClaw → BrowserExecutionRuntime
```

The desktop UI never calls Playwright or OpenClaw directly.

## Browser automation

- Playwright-backed pipeline when available (`OPENCLAW_MODE=local` + Playwright installed)
- Stub fallback for CI and offline development
- Session reuse via `BrowserSessionPersistence`
- Safe-domain restrictions via `ExecutionPermissionManager`

## Desktop actions

- `DesktopActionRuntime` in OpenClaw (stub)
- Electron host can delegate real launch/focus actions via IPC (future host wiring)

## UI

- `BrowserStateIndicator` — active URL + step progress
- `ExecutionPermissionPrompt` — subtle approval for external/risky actions
- Stop control on live execution panel

## Voice

Speech service maps transcripts like “open Gmail and summarize unread emails” to automate intents via `mapVoiceTranscriptToBrowserWorkflow`.

## Safety

- Execution timeout and anti-loop protection
- Permission confirmation for risky actions
- Stalled workflow recovery (Phase 94 + 95)

See also: [STABILITY.md](./STABILITY.md), [OPENCLAW_INTEGRATION_PLAN.md](./OPENCLAW_INTEGRATION_PLAN.md)
