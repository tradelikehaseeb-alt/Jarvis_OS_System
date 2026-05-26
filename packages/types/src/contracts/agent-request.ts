import type { UserTask } from "./user-task";

/**
 * Request dispatched from the orchestrator to a registered agent (Hermes, etc.).
 * No agent implementation in Phase 2 — contract only.
 */
export interface AgentRequest {
  readonly requestId: string;
  /** Target agent identifier from the orchestrator agent-registry. */
  readonly agentId: string;
  readonly task: UserTask;
  /** Orchestrator context reference (see ContextManager). */
  readonly contextRef?: string;
  /** Workflow step that produced this request, if any. */
  readonly workflowStepId?: string;
}
