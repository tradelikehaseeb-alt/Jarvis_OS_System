import type { TaskExecutionRecord } from "./task-record";
import type { TaskStore } from "./task-store";

/**
 * In-memory {@link TaskStore} for tests and ephemeral runs (Phase 15).
 * No cross-process persistence.
 */
export class InMemoryTaskStore implements TaskStore {
  readonly storeId = "in-memory-task-store" as const;

  private readonly records = new Map<string, TaskExecutionRecord>();

  save(record: TaskExecutionRecord): void {
    this.records.set(record.createTaskResponse.taskId, record);
  }

  get(taskId: string): TaskExecutionRecord | undefined {
    return this.records.get(taskId);
  }

  has(taskId: string): boolean {
    return this.records.has(taskId);
  }

  listTaskIds(): readonly string[] {
    return [...this.records.keys()];
  }
}
