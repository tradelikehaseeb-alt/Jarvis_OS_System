import type { TaskExecutionRecord } from "./task-record";

/**
 * Task persistence contract (Phase 15).
 *
 * Orchestrator code depends on this interface only — not on file paths or databases.
 * Future backends (PostgreSQL, Redis, etc.) implement the same surface.
 */
export interface TaskStore {
  readonly storeId: string;

  /** Persist or replace a task execution record. */
  save(record: TaskExecutionRecord): void;

  /** Load a record by task id; undefined when not found. */
  get(taskId: string): TaskExecutionRecord | undefined;

  /** Whether a task id exists in the store. */
  has(taskId: string): boolean;

  /** All stored task ids (used by file-backed implementations for serialization). */
  listTaskIds(): readonly string[];
}
