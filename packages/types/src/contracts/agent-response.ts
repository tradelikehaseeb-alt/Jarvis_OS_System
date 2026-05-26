import type { TaskError } from "./task-result";

/**
 * Response returned by an agent to the orchestrator.
 */
export interface AgentResponse {
  /** Matches {@link AgentRequest.requestId}. */
  readonly requestId: string;
  readonly agentId: string;
  readonly success: boolean;
  /** Agent-specific payload (plans, execution handles, etc.). */
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly error?: TaskError;
}
