export type LongRunningTaskState = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface LongRunningTaskRecord {
  readonly taskId: string;
  readonly description: string;
  readonly state: LongRunningTaskState;
  readonly progress: number;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
}

/**
 * Tracks long-running background workforce tasks (Phase 97).
 */
export class LongRunningTaskRuntime {
  private readonly tasks = new Map<string, LongRunningTaskRecord>();

  enqueue(description: string): LongRunningTaskRecord {
    const now = new Date().toISOString();
    const task: LongRunningTaskRecord = {
      taskId: `long-task-${Date.now()}`,
      description,
      state: "queued",
      progress: 0,
      startedAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.taskId, task);
    return task;
  }

  start(taskId: string): LongRunningTaskRecord | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }
    const updated = { ...task, state: "running" as const, updatedAt: new Date().toISOString() };
    this.tasks.set(taskId, updated);
    return updated;
  }

  updateProgress(taskId: string, progress: number): LongRunningTaskRecord | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }
    const updated = {
      ...task,
      progress: Math.max(0, Math.min(1, progress)),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(taskId, updated);
    return updated;
  }

  complete(taskId: string, success: boolean): LongRunningTaskRecord | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }
    const now = new Date().toISOString();
    const updated: LongRunningTaskRecord = {
      ...task,
      state: success ? "completed" : "failed",
      progress: success ? 1 : task.progress,
      updatedAt: now,
      completedAt: now,
    };
    this.tasks.set(taskId, updated);
    return updated;
  }

  cancel(taskId: string): LongRunningTaskRecord | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }
    const updated: LongRunningTaskRecord = {
      ...task,
      state: "cancelled",
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(taskId, updated);
    return updated;
  }

  listActive(): readonly LongRunningTaskRecord[] {
    return [...this.tasks.values()].filter(
      (task) => task.state === "queued" || task.state === "running",
    );
  }
}

export function createDefaultLongRunningTaskRuntime(): LongRunningTaskRuntime {
  return new LongRunningTaskRuntime();
}
