/**
 * Outcome of orchestrated task processing.
 */
export interface TaskResult {
  /** Matches {@link UserTask.id}. */
  readonly taskId: string;
  /** Terminal or in-progress status. */
  readonly status: TaskResultStatus;
  /** Structured output for API gateway / UI (Phase 3+). */
  readonly output?: Readonly<Record<string, unknown>>;
  /** Present when status is `failed`. */
  readonly error?: TaskError;
  /** ISO-8601 completion time when terminal. */
  readonly completedAt?: string;
}

/** Lifecycle status for a {@link TaskResult}. */
export type TaskResultStatus =
  | "pending"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

/** Standard error shape across Jarvis core contracts. */
export interface TaskError {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}
