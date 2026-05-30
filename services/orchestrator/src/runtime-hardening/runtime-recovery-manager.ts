import type { RuntimeRecoveryHandler } from "../runtime-startup/runtime-recovery-handler";
import type { RuntimeRecoveryContext, RuntimeRecoveryResult } from "../runtime-startup/runtime-recovery-handler";
import type { RuntimeStartupManager } from "../runtime-startup/runtime-startup-manager";
import type { RuntimeStartupState } from "../runtime-startup/runtime-startup-state";

export interface RuntimeRecoveryPlan {
  readonly processRecovery?: RuntimeRecoveryResult;
  readonly startupPhase?: RuntimeStartupState;
  readonly message: string;
  readonly recovered: boolean;
}

/**
 * Unified runtime recovery facade — delegates to startup recovery (Phase 94).
 */
export class RuntimeRecoveryManager {
  private recovering = false;

  constructor(
    private readonly startupManager: RuntimeStartupManager,
    private readonly recoveryHandler?: RuntimeRecoveryHandler,
  ) {}

  get isRecovering(): boolean {
    return this.recovering;
  }

  async recoverFromFailure(context: RuntimeRecoveryContext): Promise<RuntimeRecoveryPlan> {
    if (this.recovering) {
      return {
        message: "Recovery already in progress",
        recovered: false,
        startupPhase: this.startupManager.getStartupStatus(),
      };
    }

    this.recovering = true;
    try {
      if (this.recoveryHandler) {
        const processRecovery = await this.recoveryHandler.recover(context);
        if (processRecovery.recovered) {
          const phase = await this.startupManager.validateRuntime();
          return {
            processRecovery,
            startupPhase: phase,
            message: processRecovery.message,
            recovered: true,
          };
        }
      }

      const phase = await this.startupManager.recoverRuntime();
      return {
        startupPhase: phase,
        message: "Runtime recovery completed",
        recovered: phase.phase === "ready" || phase.phase === "degraded",
      };
    } finally {
      this.recovering = false;
    }
  }

  async recoverDegradedRuntime(): Promise<RuntimeRecoveryPlan> {
    return this.recoverFromFailure({
      failedProcesses: [],
      reason: "degraded-runtime",
    });
  }
}
