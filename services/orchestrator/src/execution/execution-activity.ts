/**
 * Activity source for streaming execution updates (Phase 45).
 */
export type ExecutionActivitySource = "hermes" | "openclaw" | "orchestrator";

/**
 * Activity kinds emitted during planning and execution handshakes.
 */
export type ExecutionActivityKind =
  | "planning_started"
  | "plan_generated"
  | "planning_completed"
  | "execution_started"
  | "execution_progress"
  | "execution_completed";

/**
 * Streaming activity update — Hermes planning or OpenClaw execution (Phase 45).
 */
export interface ExecutionActivity {
  readonly activityId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly source: ExecutionActivitySource;
  readonly kind: ExecutionActivityKind;
  readonly timestamp: string;
  readonly summary: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}
