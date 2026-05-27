import type { ExecutionActivity } from "./execution-activity";
import type { ExecutionState } from "./execution-state";

/**
 * Lifecycle event kinds for internal streaming (Phase 45).
 */
export type ExecutionEventKind =
  | "session_started"
  | "state_changed"
  | "activity"
  | "session_completed"
  | "session_failed"
  | "session_cancelled";

/**
 * Internal execution lifecycle event (Phase 45).
 */
export interface ExecutionEvent {
  readonly eventId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly kind: ExecutionEventKind;
  readonly state: ExecutionState;
  readonly timestamp: string;
  readonly message?: string;
  readonly activity?: ExecutionActivity;
}
