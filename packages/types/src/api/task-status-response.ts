import type { TaskError, TaskResultStatus } from "../contracts/task-result";

/**
 * HTTP response for task status polling (`GET /tasks/{id}` — Phase 4+).
 */
export interface TaskStatusResponse {
  readonly taskId: string;
  readonly status: TaskResultStatus;
  /** 0–100 progress hint when status is `running` (optional). */
  readonly progressPercent?: number;
  readonly output?: Readonly<Record<string, unknown>>;
  readonly error?: TaskError;
  readonly updatedAt: string;
}
