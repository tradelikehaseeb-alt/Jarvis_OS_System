import type { ExecutionActivity, ExecutionActivityKind } from "./execution-activity";
import type { ExecutionEvent } from "./execution-event";
import type { ExecutionSession, StartExecutionSessionInput } from "./execution-session";
import type { ExecutionState } from "./execution-state";

export interface EmitExecutionActivityInput {
  readonly taskId: string;
  readonly source: ExecutionActivity["source"];
  readonly kind: ExecutionActivityKind;
  readonly summary: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export type ExecutionEventListener = (event: ExecutionEvent) => void;
export type ExecutionActivityListener = (activity: ExecutionActivity) => void;

/**
 * Orchestrator execution lifecycle — session state + activity streaming (Phase 45).
 */
export interface ExecutionLifecycleManager {
  startSession(input: StartExecutionSessionInput): ExecutionSession;
  getSession(sessionId: string): ExecutionSession | undefined;
  getSessionByTaskId(taskId: string): ExecutionSession | undefined;
  transition(
    sessionId: string,
    state: ExecutionState,
    message?: string,
  ): ExecutionSession;
  emitActivity(
    sessionId: string,
    input: EmitExecutionActivityInput,
  ): ExecutionActivity;
  subscribe(listener: ExecutionEventListener): () => void;
  subscribeActivities(listener: ExecutionActivityListener): () => void;
}
