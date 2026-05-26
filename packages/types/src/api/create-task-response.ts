import type { TaskResultStatus } from "../contracts/task-result";

/**
 * HTTP response after a task is accepted by the API gateway.
 */
export interface CreateTaskResponse {
  readonly taskId: string;
  readonly status: TaskResultStatus;
  /** ISO-8601 when the task was accepted. */
  readonly createdAt: string;
  /** Echo of client correlation id when provided. */
  readonly correlationId?: string;
}
