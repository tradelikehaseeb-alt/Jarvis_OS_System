# Browser runtime (Phase 61, 68, 69)

```
Desktop → API Runtime → Orchestrator → OpenClaw Runtime → Browser Runtime → Action Pipeline → Execution Result
```

Validation and stub execution path for browser tasks. No real browsing automation.

## Components

| Export | Role |
|--------|------|
| `BrowserRuntimeBootstrap` | Bootstrap contract — init, validate, create session, terminate |
| `BrowserRuntimeConfig` | Bootstrap configuration (stub, sandbox, session prefix) |
| `BrowserRuntimeSessionInfo` | Bootstrap-level session snapshot |
| `BrowserRuntimeValidator` | Runtime readiness validation |
| `createDefaultBrowserRuntimeBootstrap()` | Stub bootstrap factory |
| `BrowserAction` | Stub action kinds (`open-page`, `click-element`, `type-text`, `extract-content`) |
| `BrowserActionRequest` | Single action request |
| `BrowserActionResult` | Single action result |
| `BrowserActionPipeline` | Action pipeline contract |
| `BrowserActionValidator` | Action validation contract |
| `createDefaultBrowserActionPipeline()` | Stub pipeline factory |
| `BrowserRuntimeSession` | Execution session contract |
| `BrowserExecutionRequest` | Browser task request |
| `BrowserExecutionResult` | Stub execution result |
| `BrowserRuntimeHealth` | Browser validation snapshot |
| `createBrowserRuntimeSession()` | Direct stub session factory |
| `runBrowserRuntimePath()` | Bootstrap-backed path (default) or direct session fallback |

## Action pipeline flow (Phase 69)

1. `validateAction()`
2. `executeAction()` — single stub action
3. `executePipeline()` — sequential stub actions

Supported stub actions: `open-page`, `click-element`, `type-text`, `extract-content`.

Legacy `navigate` execution requests map to `open-page`.

## Bootstrap flow (Phase 68)

1. `initializeRuntime()`
2. `validateRuntime()`
3. `createSession()` → `BrowserRuntimeSession`
4. `executeBrowserTask()` → action pipeline
5. `terminateRuntime()`

## Session flow (Phase 61, direct stub fallback)

1. `initializeSession()`
2. `validateBrowser()`
3. `executeBrowserTask()` → action pipeline (default) or inline stub fallback
4. `terminateSession()`

Pass an explicit `BrowserRuntimeSession` to `runBrowserRuntimePath()` to preserve the direct stub path.

Wired into `DefaultOpenClawGateway`, `OpenClawRuntimeSession`, and `OpenClawAgent` when browser actions are requested.

## Constraints

- Stub fallback preserved
- No real browser automation or device control
- Gateway, adapter, and session interfaces unchanged
