# Phase 95 — Real Browser & Desktop Execution Runtime

## Modules

| Module | Role |
|--------|------|
| `BrowserExecutionRuntime` | Session reuse, permissions, safety, workflow execution |
| `BrowserSessionPersistence` | Active session cache + idle cleanup |
| `DesktopActionRuntime` | Desktop action contract (stub; host IPC in desktop) |
| `ExecutionPermissionManager` | Domain allowlist + risky action confirmation |
| `ExecutionSafetyRuntime` | Timeout, anti-loop, stall detection |
| `createPlaywrightBrowserActionPipeline` | Optional Playwright backend |

## Flow

```
OpenClawAgent → BrowserExecutionRuntime → BrowserActionPipeline → Playwright (optional)
```

Set `OPENCLAW_MODE=local` for non-stub request building; Playwright launches when installed.

## Tests

```bash
npm run test --workspace=@jarvis/openclaw -- --run src/execution-runtime
```
