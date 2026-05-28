export type BackgroundTaskState = "pending" | "running" | "completed" | "failed" | "stalled";

export interface BackgroundTaskRecord {
  readonly taskId: string;
  readonly workflowId: string;
  readonly userLabel: string;
  readonly state: BackgroundTaskState;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly stepCount: number;
}

const MAX_STEPS = 50;
const STALL_THRESHOLD = 20;

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Supervises background tasks with timeout and stall recovery (Phase 99).
 */
export class BackgroundTaskSupervisor {
  private readonly tasks = new Map<string, BackgroundTaskRecord>();
  private cancelled = false;

  enqueue(workflowId: string, userLabel: string): BackgroundTaskRecord {
    const task: BackgroundTaskRecord = {
      taskId: nextId("bg-task"),
      workflowId,
      userLabel,
      state: "pending",
      startedAt: nowIso(),
      updatedAt: nowIso(),
      stepCount: 0,
    };
    this.tasks.set(task.taskId, task);
    return task;
  }

  start(taskId: string): BackgroundTaskRecord | undefined {
    const task = this.tasks.get(taskId);
    if (!task || this.cancelled) {
      return undefined;
    }
    const updated = { ...task, state: "running" as const, updatedAt: nowIso() };
    this.tasks.set(taskId, updated);
    return updated;
  }

  beforeStep(taskId: string): { allowed: boolean; recover: boolean; message: string } {
    if (this.cancelled) {
      return { allowed: false, recover: false, message: "Background task cancelled" };
    }
    const task = this.tasks.get(taskId);
    if (!task) {
      return { allowed: false, recover: false, message: "Task not found" };
    }
    const stepCount = task.stepCount + 1;
    if (stepCount > MAX_STEPS) {
      return { allowed: false, recover: true, message: "Step limit reached — recovering" };
    }
    if (stepCount > STALL_THRESHOLD) {
      return { allowed: false, recover: true, message: "Stalled workflow recovered" };
    }
    this.tasks.set(taskId, { ...task, stepCount, updatedAt: nowIso() });
    return { allowed: true, recover: false, message: "OK" };
  }

  complete(taskId: string, success: boolean): BackgroundTaskRecord | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }
    const updated = {
      ...task,
      state: success ? ("completed" as const) : ("failed" as const),
      updatedAt: nowIso(),
    };
    this.tasks.set(taskId, updated);
    return updated;
  }

  recover(taskId: string): BackgroundTaskRecord | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }
    const updated = {
      ...task,
      state: "running" as const,
      stepCount: 0,
      updatedAt: nowIso(),
    };
    this.tasks.set(taskId, updated);
    return updated;
  }

  cancel(): void {
    this.cancelled = true;
  }

  reset(): void {
    this.cancelled = false;
  }

  cleanupInactive(maxAgeMs = 3600_000): number {
    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;
    for (const [id, task] of this.tasks) {
      if (
        (task.state === "completed" || task.state === "failed") &&
        new Date(task.updatedAt).getTime() < cutoff
      ) {
        this.tasks.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  listActive(): readonly BackgroundTaskRecord[] {
    return [...this.tasks.values()].filter(
      (entry) => entry.state === "running" || entry.state === "pending",
    );
  }
}

export function createDefaultBackgroundTaskSupervisor(): BackgroundTaskSupervisor {
  return new BackgroundTaskSupervisor();
}
