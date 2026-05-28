# Phase 95 — Workflow Execution Engine

## Modules

| Module | Role |
|--------|------|
| `WorkflowExecutionEngine` | Builds multi-step browser/desktop workflows from automate intents |
| `ExecutionSafetyRuntime` | Pre-step safety gate wrapping OpenClaw safety |

Wired in `create-task-executor.ts` via `executeOpenClawStep` guard and `executionRuntime` task output.

## Example intent

> Open Gmail and summarize unread emails

Produces workflow steps: open Gmail → extract inbox → summarize task.

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator -- --run src/execution-runtime
```
