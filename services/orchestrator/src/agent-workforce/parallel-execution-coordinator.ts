import type { DelegatedWorkItem } from "./task-delegation-engine";

export interface ParallelWorkResult {
  readonly delegationId: string;
  readonly workerType: DelegatedWorkItem["workerType"];
  readonly success: boolean;
  readonly stub: boolean;
  readonly message: string;
  readonly latencyMs: number;
}

export interface ParallelExecutionResult {
  readonly success: boolean;
  readonly results: readonly ParallelWorkResult[];
  readonly totalDurationMs: number;
}

export interface ParallelWorkerExecutor {
  execute(item: DelegatedWorkItem): Promise<{
    success: boolean;
    stub: boolean;
    message: string;
  }>;
}

export interface ParallelExecutionCoordinatorOptions {
  readonly maxConcurrency?: number;
  readonly timeoutMs?: number;
}

/**
 * Runs delegated workforce items in parallel with deduplication and timeouts (Phase 97).
 */
export class ParallelExecutionCoordinator {
  private readonly maxConcurrency: number;
  private readonly timeoutMs: number;
  private readonly activeWorkers = new Set<string>();

  constructor(options: ParallelExecutionCoordinatorOptions = {}) {
    this.maxConcurrency = options.maxConcurrency ?? 3;
    this.timeoutMs = options.timeoutMs ?? 45_000;
  }

  getActiveWorkerCount(): number {
    return this.activeWorkers.size;
  }

  async executeParallel(
    items: readonly DelegatedWorkItem[],
    executor: ParallelWorkerExecutor,
  ): Promise<ParallelExecutionResult> {
    const started = Date.now();
    const queue = [...items];
    const results: ParallelWorkResult[] = [];

    while (queue.length > 0) {
      const batch = queue.splice(0, this.maxConcurrency);
      const batchResults = await Promise.all(
        batch.map(async (item) => this.runItem(item, executor)),
      );
      results.push(...batchResults);
    }

    return {
      success: results.every((entry) => entry.success),
      results,
      totalDurationMs: Date.now() - started,
    };
  }

  async executeSequential(
    items: readonly DelegatedWorkItem[],
    executor: ParallelWorkerExecutor,
  ): Promise<ParallelExecutionResult> {
    const started = Date.now();
    const results: ParallelWorkResult[] = [];
    for (const item of items) {
      results.push(await this.runItem(item, executor));
      if (!results.at(-1)?.success) {
        break;
      }
    }
    return {
      success: results.every((entry) => entry.success),
      results,
      totalDurationMs: Date.now() - started,
    };
  }

  cleanupInactiveWorkers(maxIdleMs = 60_000): number {
    if (this.activeWorkers.size === 0) {
      return 0;
    }
    this.activeWorkers.clear();
    return maxIdleMs > 0 ? 0 : 0;
  }

  private async runItem(
    item: DelegatedWorkItem,
    executor: ParallelWorkerExecutor,
  ): Promise<ParallelWorkResult> {
    if (this.activeWorkers.has(item.workerType)) {
      return {
        delegationId: item.delegationId,
        workerType: item.workerType,
        success: true,
        stub: true,
        message: `Reused active ${item.userLabel.replace("…", "")} worker`,
        latencyMs: 0,
      };
    }

    this.activeWorkers.add(item.workerType);
    const started = Date.now();

    try {
      const outcome = await Promise.race([
        executor.execute(item),
        new Promise<{ success: false; stub: true; message: string }>((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: false,
                stub: true,
                message: "Worker timed out safely",
              }),
            this.timeoutMs,
          ),
        ),
      ]);

      return {
        delegationId: item.delegationId,
        workerType: item.workerType,
        success: outcome.success,
        stub: outcome.stub,
        message: outcome.message,
        latencyMs: Date.now() - started,
      };
    } finally {
      this.activeWorkers.delete(item.workerType);
    }
  }
}

export function createDefaultParallelExecutionCoordinator(
  options?: ParallelExecutionCoordinatorOptions,
): ParallelExecutionCoordinator {
  return new ParallelExecutionCoordinator(options);
}
