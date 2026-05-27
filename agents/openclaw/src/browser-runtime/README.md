# Browser runtime (Phase 61)

```
OpenClaw Runtime → Browser Runtime → Execution Result
```

Validation and stub execution path for browser tasks. No real browsing automation.

## Components

| Export | Role |
|--------|------|
| `BrowserRuntimeSession` | Session contract |
| `BrowserExecutionRequest` | Browser task request |
| `BrowserExecutionResult` | Stub execution result |
| `BrowserRuntimeHealth` | Browser validation snapshot |
| `createBrowserRuntimeSession()` | Stub session factory |

## Session flow

1. `initializeSession()`
2. `validateBrowser()`
3. `executeBrowserTask()`
4. `terminateSession()`

Wired into `DefaultOpenClawGateway` and `OpenClawAgent` when browser actions are requested.

## Constraints

- Stub fallback preserved
- No real browser automation or device control
- Gateway and adapter interfaces unchanged
