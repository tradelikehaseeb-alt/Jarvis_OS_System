import {
  createDefaultExecutionSafetyRuntime,
  ExecutionSafetyRuntime as OpenClawExecutionSafetyRuntime,
} from "@jarvis/openclaw";

export interface OrchestratorExecutionSafetyInput {
  readonly stepCount: number;
  readonly startedAt: string;
  readonly lastProgressAt?: string;
  readonly actionKey?: string;
}

export interface OrchestratorExecutionSafetyDecision {
  readonly allowed: boolean;
  readonly message: string;
  readonly stalled: boolean;
  readonly loopDetected: boolean;
  readonly timedOut: boolean;
}

/**
 * Orchestrator-level safety wrapper over OpenClaw execution safety (Phase 95).
 */
export class ExecutionSafetyRuntime {
  private readonly safety: OpenClawExecutionSafetyRuntime;

  constructor(safety?: OpenClawExecutionSafetyRuntime) {
    this.safety = safety ?? createDefaultExecutionSafetyRuntime();
  }

  beforeStep(input: OrchestratorExecutionSafetyInput): OrchestratorExecutionSafetyDecision {
    if (input.actionKey) {
      this.safety.recordAction(input.actionKey);
    }

    const decision = this.safety.evaluate({
      stepCount: input.stepCount,
      startedAt: input.startedAt,
      lastProgressAt: input.lastProgressAt,
    });

    return {
      allowed: decision.allowed,
      message: decision.message,
      stalled: decision.stalled,
      loopDetected: decision.loopDetected,
      timedOut: decision.timedOut,
    };
  }

  reset(): void {
    this.safety.reset();
  }
}

export function createDefaultOrchestratorExecutionSafetyRuntime(): ExecutionSafetyRuntime {
  return new ExecutionSafetyRuntime();
}
