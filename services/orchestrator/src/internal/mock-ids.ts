/**
 * Deterministic mock id helpers for orchestrator stubs (Phase 4).
 * Not for production — wiring and tests only.
 */

export function mockWorkflowId(taskId: string): string {
  return `wf-stub-${taskId}`;
}

export function mockContextRef(taskId: string): string {
  return `ctx-stub-${taskId}`;
}

export function mockExecutionId(stepId: string): string {
  return `exec-stub-${stepId}`;
}

export function mockRequestId(taskId: string): string {
  return `req-stub-${taskId}`;
}

/** Fixed ISO timestamp for static stub responses. */
export const MOCK_TIMESTAMP = "2026-01-01T00:00:00.000Z";
