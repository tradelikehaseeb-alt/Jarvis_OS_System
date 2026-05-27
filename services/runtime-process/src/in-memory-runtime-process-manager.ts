import type { RuntimeHealth, RuntimeProcessHealthEntry } from "./runtime-health";
import type { RuntimeProcess } from "./runtime-process";
import type { RuntimeProcessState } from "./runtime-process-state";
import type {
  RuntimeProcessHandlers,
  RuntimeProcessManager,
  RuntimeProcessRegistration,
} from "./runtime-process-manager";

interface InternalProcess {
  readonly processId: string;
  readonly label: string;
  readonly handlers: RuntimeProcessHandlers;
  state: RuntimeProcessState;
  startedAt?: string;
  stoppedAt?: string;
  lastError?: string;
  restartCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function snapshot(process: InternalProcess): RuntimeProcess {
  return {
    processId: process.processId,
    label: process.label,
    state: process.state,
    startedAt: process.startedAt,
    stoppedAt: process.stoppedAt,
    lastError: process.lastError,
    restartCount: process.restartCount,
  };
}

function isActiveState(state: RuntimeProcessState): boolean {
  return state === "starting" || state === "running" || state === "restarting";
}

/**
 * Deterministic in-memory runtime process manager (Phase 55).
 */
export class InMemoryRuntimeProcessManager implements RuntimeProcessManager {
  private readonly processes = new Map<string, InternalProcess>();

  registerProcess(registration: RuntimeProcessRegistration): void {
    this.processes.set(registration.processId, {
      processId: registration.processId,
      label: registration.label,
      handlers: registration.handlers ?? {},
      state: "stopped",
      restartCount: 0,
    });
  }

  async startProcess(processId: string): Promise<RuntimeProcess> {
    const process = this.requireProcess(processId);

    if (process.state === "running") {
      return snapshot(process);
    }

    process.state = "starting";
    process.lastError = undefined;

    try {
      if (process.handlers.start) {
        await process.handlers.start();
      }
      process.state = "running";
      process.startedAt = nowIso();
      process.stoppedAt = undefined;
    } catch (error) {
      process.state = "failed";
      process.lastError = error instanceof Error ? error.message : String(error);
    }

    return snapshot(process);
  }

  async stopProcess(processId: string): Promise<RuntimeProcess> {
    const process = this.requireProcess(processId);

    if (process.state === "stopped") {
      return snapshot(process);
    }

    try {
      if (process.handlers.stop) {
        await process.handlers.stop();
      }
      process.state = "stopped";
      process.stoppedAt = nowIso();
      process.lastError = undefined;
    } catch (error) {
      process.state = "failed";
      process.lastError = error instanceof Error ? error.message : String(error);
    }

    return snapshot(process);
  }

  async restartProcess(processId: string): Promise<RuntimeProcess> {
    const process = this.requireProcess(processId);
    process.restartCount += 1;
    process.state = "restarting";

    await this.stopProcess(processId);
    return this.startProcess(processId);
  }

  getProcess(processId: string): RuntimeProcess | undefined {
    const process = this.processes.get(processId);
    return process ? snapshot(process) : undefined;
  }

  getActiveProcesses(): readonly RuntimeProcess[] {
    return [...this.processes.values()]
      .filter((process) => isActiveState(process.state))
      .map(snapshot);
  }

  getHealth(): RuntimeHealth {
    const processes = [...this.processes.values()];
    const entries: RuntimeProcessHealthEntry[] = processes.map((process) => ({
      processId: process.processId,
      label: process.label,
      state: process.state,
      healthy: process.state === "running",
      message: process.lastError,
    }));

    const runningCount = processes.filter((p) => p.state === "running").length;
    const failedCount = processes.filter((p) => p.state === "failed").length;

    let status: RuntimeHealth["status"] = "healthy";
    if (failedCount > 0) {
      status = "unavailable";
    } else if (runningCount < processes.length) {
      status = "degraded";
    }

    return {
      status,
      processCount: processes.length,
      runningCount,
      failedCount,
      checkedAt: nowIso(),
      processes: entries,
    };
  }

  private requireProcess(processId: string): InternalProcess {
    const process = this.processes.get(processId);
    if (!process) {
      throw new Error(`Runtime process not registered: ${processId}`);
    }
    return process;
  }
}
