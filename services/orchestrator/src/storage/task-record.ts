import type { CreateTaskResponse, TaskStatusResponse } from "@jarvis/types";

/**
 * Stored record for a completed create-task lifecycle (Phase 14+).
 * Serialized by {@link FileTaskStore}; held in memory by {@link InMemoryTaskStore}.
 */
export interface TaskExecutionRecord {
  readonly createTaskResponse: CreateTaskResponse;
  readonly taskStatus: TaskStatusResponse;
}
