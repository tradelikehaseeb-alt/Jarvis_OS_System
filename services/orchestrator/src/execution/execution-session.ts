import type { ExecutionActivity } from "./execution-activity";
import type { ExecutionEvent } from "./execution-event";
import type { ExecutionState } from "./execution-state";

/**
 * Active execution session tracked by the orchestrator (Phase 45).
 */
export interface ExecutionSession {
  readonly sessionId: string;
  readonly taskId: string;
  readonly requestId: string;
  readonly userId: string;
  readonly state: ExecutionState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly activities: readonly ExecutionActivity[];
  readonly events: readonly ExecutionEvent[];
}

export interface StartExecutionSessionInput {
  readonly taskId: string;
  readonly requestId: string;
  readonly userId: string;
}
