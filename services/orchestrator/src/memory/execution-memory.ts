import type { ExecutionActivity } from "../execution/execution-activity";
import type { ExecutionEvent } from "../execution/execution-event";
import type { ExecutionState } from "../execution/execution-state";

/**
 * Execution lifecycle snapshot persisted to memory (Phase 46).
 */
export interface ExecutionMemory {
  readonly sessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly state: ExecutionState;
  readonly events: readonly ExecutionEvent[];
  readonly activities: readonly ExecutionActivity[];
  readonly timestamp: string;
}
