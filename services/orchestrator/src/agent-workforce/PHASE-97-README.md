# Agent Workforce Runtime (Phase 97)

Modules in `services/orchestrator/src/agent-workforce/`:

- **AgentWorkforceRuntime** — `coordinate()` entry point; wired in `create-task-executor.ts`
- **TaskDelegationEngine** — NL → delegation plan
- **ParallelExecutionCoordinator** — parallel/sequential runs, dedup, cleanup
- **PersistentAgentSession** — session lifecycle
- **WorkflowSupervisorRuntime** — loops, cancel, summarize
- **AgentCapabilityRegistry** — 7 worker types + user labels
- **LongRunningTaskRuntime** — background progress

Task output includes `workforce` when `shouldCoordinateWorkforce()` matches multi-clause research/automation intents.
