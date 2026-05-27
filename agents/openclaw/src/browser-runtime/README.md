# Browser runtime (Phase 61, 68, 69, 70)

```
Desktop → API Runtime → Orchestrator → OpenClaw Runtime → Browser Runtime → Page Context Runtime → Action Pipeline → Execution Result
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
| `BrowserPageContext` | Active page/session context |
| `BrowserPageSnapshot` | Point-in-time page snapshot |
| `BrowserSessionState` | Page context lifecycle state |
| `BrowserContextRuntime` | Page context contract |
| `createDefaultBrowserContextRuntime()` | Stub context factory |
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

## Page context flow (Phase 70)

1. `initializeContext()` — session start
2. `updateContext()` — after each pipeline action
3. `getCurrentContext()` — read current page state
4. `clearContext()` — session end

Context persists URL, active selector, action count, and extract snapshots across pipeline actions.

## Action pipeline flow (Phase 69)

1. `validateAction()`
2. `executeAction()` — single stub action (updates context when initialized)
3. `executePipeline()` — sequential stub actions with shared context

Supported stub actions: `open-page`, `click-element`, `type-text`, `extract-content`.

Legacy `navigate` execution requests map to `open-page`.

## Bootstrap flow (Phase 68)

1. `initializeRuntime()`
2. `validateRuntime()`
3. `createSession()` → `BrowserRuntimeSession`
4. `executeBrowserTask()` → action pipeline
5. `terminateRuntime()`

## Session flow (Phase 61, direct stub fallback)

1. `initializeSession()` → `initializeContext()`
2. `validateBrowser()`
3. `executeBrowserTask()` → action pipeline (default) or inline stub fallback
4. `terminateSession()` → `clearContext()`

Pass an explicit `BrowserRuntimeSession` to `runBrowserRuntimePath()` to preserve the direct stub path.

Wired into `DefaultOpenClawGateway`, `OpenClawRuntimeSession`, and `OpenClawAgent` when browser actions are requested.

## Constraints

- Stub fallback preserved
- No real browser automation or device control
- Gateway, adapter, and session interfaces unchanged
