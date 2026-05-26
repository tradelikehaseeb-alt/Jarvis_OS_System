import type { AgentCapabilityMatch } from "./agent-capability-match";

/**
 * Outcome of capability-based agent selection (Phase 12).
 */
export interface RoutingDecision {
  readonly taskId: string;
  readonly selectedAgentId: string;
  readonly policyId: string;
  /** Static explanation for logs/tests — not LLM-generated. */
  readonly reason: string;
  readonly matches: readonly AgentCapabilityMatch[];
}
