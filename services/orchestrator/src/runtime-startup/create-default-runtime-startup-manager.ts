import type { RuntimeProcessManager } from "@jarvis/runtime-process";
import { DEFAULT_RUNTIME_PROCESS_IDS } from "@jarvis/runtime-process";

import { createDefaultRuntimeRecoveryHandler } from "./create-default-runtime-recovery-handler";
import type { RuntimeRecoveryHandler } from "./runtime-recovery-handler";
import type { RuntimeStartupEvent } from "./runtime-startup-event";
import type { RuntimeStartupHealthProbe } from "./runtime-startup-health-probe";
import type { RuntimeStartupManager } from "./runtime-startup-manager";
import type {
  RuntimeStartupPhase,
  RuntimeStartupState,
} from "./runtime-startup-state";

export interface CreateDefaultRuntimeStartupManagerOptions {
  readonly bootstrap?: () => Promise<void>;
  readonly processManager?: RuntimeProcessManager;
  readonly startProcesses?: () => Promise<void>;
  readonly healthProbes?: readonly RuntimeStartupHealthProbe[];
  readonly recoveryHandler?: RuntimeRecoveryHandler;
}

let eventCounter = 0;

function nextEventId(): string {
  eventCounter += 1;
  return `runtime-startup-${eventCounter}`;
}

function buildEvent(
  kind: RuntimeStartupEvent["kind"],
  message: string,
  phase?: RuntimeStartupPhase,
  processId?: string,
): RuntimeStartupEvent {
  return {
    id: nextEventId(),
    kind,
    message,
    timestamp: new Date().toISOString(),
    phase,
    processId,
  };
}

function createInitialState(): RuntimeStartupState {
  return {
    phase: "idle",
    ready: false,
    initialized: false,
    validated: false,
    recovered: false,
    processCount: 0,
    healthyProcessCount: 0,
    failedProcesses: [],
    updatedAt: new Date().toISOString(),
  };
}

function buildProbesFromProcessManager(
  manager: RuntimeProcessManager,
  extraProbes: readonly RuntimeStartupHealthProbe[] = [],
): RuntimeStartupHealthProbe[] {
  const processProbes: RuntimeStartupHealthProbe[] =
    DEFAULT_RUNTIME_PROCESS_IDS.map((processId) => ({
      probeId: processId,
      label: manager.getProcess(processId)?.label ?? processId,
      async check() {
        const health = manager.getHealth();
        const entry = health.processes.find(
          (process) => process.processId === processId,
        );
        const healthy =
          entry?.healthy ?? manager.getProcess(processId)?.state === "running";
        return {
          healthy,
          message: entry?.message ?? manager.getProcess(processId)?.lastError,
        };
      },
    }));

  return [...processProbes, ...extraProbes];
}

class DefaultRuntimeStartupManager implements RuntimeStartupManager {
  private state: RuntimeStartupState = createInitialState();
  private readonly events: RuntimeStartupEvent[] = [];
  private readonly bootstrap: () => Promise<void>;
  private readonly startProcesses: () => Promise<void>;
  private readonly healthProbes: readonly RuntimeStartupHealthProbe[];
  private readonly recoveryHandler: RuntimeRecoveryHandler;

  constructor(options: CreateDefaultRuntimeStartupManagerOptions) {
    this.bootstrap = options.bootstrap ?? (async () => {});
    this.startProcesses =
      options.startProcesses ??
      (async () => {
        if (!options.processManager) {
          return;
        }
        for (const processId of DEFAULT_RUNTIME_PROCESS_IDS) {
          await options.processManager.startProcess(processId);
        }
      });
    this.healthProbes =
      options.healthProbes ??
      (options.processManager
        ? buildProbesFromProcessManager(options.processManager)
        : []);
    this.recoveryHandler =
      options.recoveryHandler ??
      createDefaultRuntimeRecoveryHandler({
        restartProcess: options.processManager
          ? async (processId) => {
              try {
                const process =
                  await options.processManager!.restartProcess(processId);
                return process.state === "running";
              } catch {
                return false;
              }
            }
          : undefined,
      });
  }

  getStartupStatus(): RuntimeStartupState {
    return this.state;
  }

  getEvents(): readonly RuntimeStartupEvent[] {
    return this.events;
  }

  async initializeRuntime(): Promise<RuntimeStartupState> {
    this.pushEvent(
      buildEvent(
        "bootstrap_started",
        "Runtime bootstrap started",
        "bootstrapping",
      ),
    );
    this.updateState({
      phase: "bootstrapping",
      initialized: false,
      validated: false,
      recovered: false,
      ready: false,
      message: "Bootstrapping runtime",
    });

    await this.bootstrap();
    await this.startProcesses();

    this.pushEvent(
      buildEvent(
        "bootstrap_completed",
        "Runtime bootstrap completed",
        "bootstrapping",
      ),
    );
    this.updateState({
      initialized: true,
      message: "Bootstrap completed",
    });

    return this.validateRuntime();
  }

  async validateRuntime(): Promise<RuntimeStartupState> {
    this.pushEvent(
      buildEvent(
        "validation_started",
        "Runtime health validation started",
        "validating",
      ),
    );
    this.updateState({
      phase: "validating",
      validated: false,
      ready: false,
      message: "Validating runtime health",
    });

    const failedProcesses: string[] = [];
    let healthyCount = 0;

    for (const probe of this.healthProbes) {
      const result = await probe.check();
      if (result.healthy) {
        healthyCount += 1;
      } else {
        failedProcesses.push(probe.probeId);
      }
    }

    const processCount = this.healthProbes.length;
    let phase: RuntimeStartupPhase = "ready";
    let ready = true;
    let message = "Runtime ready";

    if (failedProcesses.length === processCount && processCount > 0) {
      phase = "failed";
      ready = false;
      message = "All runtime probes failed";
      this.pushEvent(buildEvent("failed", message, phase));
    } else if (failedProcesses.length > 0) {
      phase = "degraded";
      ready = false;
      message = `Degraded runtime: ${failedProcesses.join(", ")} unhealthy`;
      this.pushEvent(buildEvent("degraded", message, phase));
    } else {
      this.pushEvent(buildEvent("ready", message, phase));
    }

    this.pushEvent(
      buildEvent(
        "validation_completed",
        `Validation complete: ${healthyCount}/${processCount} healthy`,
        phase,
      ),
    );

    this.updateState({
      phase,
      ready,
      validated: true,
      processCount,
      healthyProcessCount: healthyCount,
      failedProcesses,
      message,
    });

    return this.state;
  }

  async recoverRuntime(): Promise<RuntimeStartupState> {
    if (this.state.ready) {
      return this.state;
    }

    this.pushEvent(
      buildEvent("recovery_started", "Runtime recovery started", "recovering"),
    );
    this.updateState({
      phase: "recovering",
      recovered: false,
      message: "Recovering runtime",
    });

    const recovery = await this.recoveryHandler.recover({
      failedProcesses: this.state.failedProcesses,
      reason: this.state.message ?? "Runtime validation failed",
    });

    this.pushEvent(recovery.event);

    if (recovery.action === "retry_bootstrap") {
      return this.initializeRuntime();
    }

    this.updateState({
      recovered: recovery.recovered,
      message: recovery.message,
    });

    return this.validateRuntime();
  }

  private pushEvent(event: RuntimeStartupEvent): void {
    this.events.push(event);
  }

  private updateState(partial: Partial<RuntimeStartupState>): void {
    this.state = {
      ...this.state,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Factory for default desktop runtime startup manager (Phase 73).
 */
export function createDefaultRuntimeStartupManager(
  options: CreateDefaultRuntimeStartupManagerOptions = {},
): RuntimeStartupManager {
  return new DefaultRuntimeStartupManager(options);
}

export { buildProbesFromProcessManager };
