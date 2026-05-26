/**
 * Standard agent execution outcome returned to the orchestrator.
 * Mirrors {@link AgentResponse} from @jarvis/types at the agents layer.
 */
export interface AgentError {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface AgentResult {
  readonly taskId: string;
  readonly requestId: string;
  readonly agentId: string;
  readonly success: boolean;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly error?: AgentError;
}
