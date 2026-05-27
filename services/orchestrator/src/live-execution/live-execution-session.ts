/** Live execution session state (Phase 84). */
export type LiveExecutionSessionState =
  | "idle"
  | "running"
  | "completed"
  | "failed";

/**
 * Orchestrator live execution session — aggregates provider, task, and stream ids.
 */
export interface LiveExecutionSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly conversationId: string;
  readonly providerId: string;
  readonly state: LiveExecutionSessionState;
  readonly startedAt: string;
  readonly taskId?: string;
  readonly stub: boolean;
}
