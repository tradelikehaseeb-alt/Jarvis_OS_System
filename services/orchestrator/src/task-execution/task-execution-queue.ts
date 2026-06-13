export interface TaskExecutionQueueJob {
  readonly taskId: string;
  readonly run: () => Promise<void>;
}

export interface TaskExecutionQueueOptions {
  readonly maxConcurrency?: number;
}

/**
 * Background task execution queue — runs orchestration off the request hot path.
 */
export class TaskExecutionQueue {
  private readonly maxConcurrency: number;
  private activeCount = 0;
  private readonly pending: TaskExecutionQueueJob[] = [];
  private readonly activeTaskIds = new Set<string>();

  constructor(options: TaskExecutionQueueOptions = {}) {
    this.maxConcurrency = Math.max(1, options.maxConcurrency ?? 3);
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getPendingCount(): number {
    return this.pending.length;
  }

  isTaskActive(taskId: string): boolean {
    return this.activeTaskIds.has(taskId);
  }

  enqueue(job: TaskExecutionQueueJob): void {
    if (this.activeTaskIds.has(job.taskId)) {
      return;
    }
    this.pending.push(job);
    void this.drain();
  }

  private async drain(): Promise<void> {
    while (this.activeCount < this.maxConcurrency && this.pending.length > 0) {
      const job = this.pending.shift();
      if (!job) {
        return;
      }
      this.activeCount += 1;
      this.activeTaskIds.add(job.taskId);
      void job
        .run()
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Background task execution failed";
          console.error(`[task-queue] ${job.taskId} failed:`, message);
        })
        .finally(() => {
          this.activeCount -= 1;
          this.activeTaskIds.delete(job.taskId);
          void this.drain();
        });
    }
  }
}

let defaultQueue: TaskExecutionQueue | undefined;

export function getDefaultTaskExecutionQueue(): TaskExecutionQueue {
  if (!defaultQueue) {
    const configured = Number(process.env.ORCHESTRATOR_TASK_QUEUE_CONCURRENCY ?? "3");
    defaultQueue = new TaskExecutionQueue({
      maxConcurrency: Number.isFinite(configured) ? configured : 3,
    });
  }
  return defaultQueue;
}

export function resetDefaultTaskExecutionQueueForTests(): void {
  defaultQueue = undefined;
}

export function shouldExecuteTaskSynchronously(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.ORCHESTRATOR_SYNC_TASK_EXECUTION === "true" || env.NODE_ENV === "test"
  );
}
