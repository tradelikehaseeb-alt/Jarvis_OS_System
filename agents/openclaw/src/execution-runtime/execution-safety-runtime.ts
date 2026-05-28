export interface ExecutionSafetyInput {
  readonly stepCount: number;
  readonly startedAt: string;
  readonly lastProgressAt?: string;
  readonly nowMs?: number;
}

export interface ExecutionSafetyDecision {
  readonly allowed: boolean;
  readonly stalled: boolean;
  readonly loopDetected: boolean;
  readonly timedOut: boolean;
  readonly message: string;
}

export interface ExecutionSafetyRuntimeOptions {
  readonly maxSteps?: number;
  readonly timeoutMs?: number;
  readonly stallThresholdMs?: number;
}

const DEFAULT_MAX_STEPS = 24;
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_STALL_MS = 45_000;

/**
 * Anti-loop, timeout, and stall protection for browser/desktop workflows (Phase 95).
 */
export class ExecutionSafetyRuntime {
  private readonly maxSteps: number;
  private readonly timeoutMs: number;
  private readonly stallThresholdMs: number;
  private readonly recentActions: string[] = [];

  constructor(options: ExecutionSafetyRuntimeOptions = {}) {
    this.maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.stallThresholdMs = options.stallThresholdMs ?? DEFAULT_STALL_MS;
  }

  recordAction(actionKey: string): void {
    this.recentActions.push(actionKey);
    if (this.recentActions.length > 12) {
      this.recentActions.shift();
    }
  }

  evaluate(input: ExecutionSafetyInput): ExecutionSafetyDecision {
    const nowMs = input.nowMs ?? Date.now();
    const startedMs = Date.parse(input.startedAt);
    const timedOut =
      !Number.isNaN(startedMs) && nowMs - startedMs > this.timeoutMs;
    const stalled = this.isStalled(input.lastProgressAt, nowMs);
    const loopDetected = this.detectLoop();
    const overStepLimit = input.stepCount > this.maxSteps;

    if (timedOut) {
      return {
        allowed: false,
        stalled,
        loopDetected,
        timedOut: true,
        message: "Execution timed out — workflow stopped safely",
      };
    }

    if (overStepLimit) {
      return {
        allowed: false,
        stalled,
        loopDetected,
        timedOut: false,
        message: "Step limit reached — anti-loop protection engaged",
      };
    }

    if (loopDetected) {
      return {
        allowed: false,
        stalled,
        loopDetected: true,
        timedOut: false,
        message: "Repeated actions detected — workflow halted",
      };
    }

    if (stalled) {
      return {
        allowed: false,
        stalled: true,
        loopDetected: false,
        timedOut: false,
        message: "Execution stalled — recovering safely",
      };
    }

    return {
      allowed: true,
      stalled: false,
      loopDetected: false,
      timedOut: false,
      message: "Execution within safety bounds",
    };
  }

  reset(): void {
    this.recentActions.length = 0;
  }

  private isStalled(lastProgressAt: string | undefined, nowMs: number): boolean {
    if (!lastProgressAt) {
      return false;
    }
    const progressMs = Date.parse(lastProgressAt);
    if (Number.isNaN(progressMs)) {
      return false;
    }
    return nowMs - progressMs > this.stallThresholdMs;
  }

  private detectLoop(): boolean {
    if (this.recentActions.length < 6) {
      return false;
    }
    const tail = this.recentActions.slice(-6);
    const first = tail[0];
    return tail.every((entry) => entry === first);
  }
}

export function createDefaultExecutionSafetyRuntime(
  options?: ExecutionSafetyRuntimeOptions,
): ExecutionSafetyRuntime {
  return new ExecutionSafetyRuntime(options);
}
