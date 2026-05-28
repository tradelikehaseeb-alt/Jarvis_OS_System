import type { ParallelWorkResult } from "./parallel-execution-coordinator";
import type { TaskDelegationPlan } from "./task-delegation-engine";

export interface WorkflowSupervisionDecision {
  readonly allowed: boolean;
  readonly recover: boolean;
  readonly cancel: boolean;
  readonly message: string;
}

export interface WorkflowSupervisorRuntimeOptions {
  readonly maxSteps?: number;
  readonly stallThresholdMs?: number;
}

/**
 * Supervises workforce workflows with recovery, cancellation, and anti-loop guards (Phase 97).
 */
export class WorkflowSupervisorRuntime {
  private readonly maxSteps: number;
  private readonly stallThresholdMs: number;
  private readonly recentActions: string[] = [];
  private cancelled = false;

  constructor(options: WorkflowSupervisorRuntimeOptions = {}) {
    this.maxSteps = options.maxSteps ?? 12;
    this.stallThresholdMs = options.stallThresholdMs ?? 60_000;
  }

  cancel(): void {
    this.cancelled = true;
  }

  reset(): void {
    this.cancelled = false;
    this.recentActions.length = 0;
  }

  beforeStep(stepIndex: number, actionKey: string): WorkflowSupervisionDecision {
    if (this.cancelled) {
      return {
        allowed: false,
        recover: false,
        cancel: true,
        message: "Workflow cancelled",
      };
    }

    if (stepIndex > this.maxSteps) {
      return {
        allowed: false,
        recover: false,
        cancel: false,
        message: "Workflow step limit reached",
      };
    }

    this.recentActions.push(actionKey);
    if (this.recentActions.length > 8) {
      this.recentActions.shift();
    }

    const loopDetected =
      this.recentActions.length >= 4 &&
      this.recentActions.every((entry) => entry === this.recentActions[0]);

    if (loopDetected) {
      return {
        allowed: false,
        recover: true,
        cancel: false,
        message: "Loop detected — recovering safely",
      };
    }

    return {
      allowed: true,
      recover: false,
      cancel: false,
      message: "Step allowed",
    };
  }

  summarize(plan: TaskDelegationPlan, results: readonly ParallelWorkResult[]): string {
    const completed = results.filter((entry) => entry.success).length;
    if (completed === results.length) {
      return `Completed ${completed} coordinated tasks for: ${plan.description.slice(0, 80)}`;
    }
    return `Partial completion (${completed}/${results.length}) — safe recovery available`;
  }
}

export function createDefaultWorkflowSupervisorRuntime(
  options?: WorkflowSupervisorRuntimeOptions,
): WorkflowSupervisorRuntime {
  return new WorkflowSupervisorRuntime(options);
}
