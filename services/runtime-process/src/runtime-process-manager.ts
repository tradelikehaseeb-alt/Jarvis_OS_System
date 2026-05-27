import type { RuntimeHealth } from "./runtime-health";
import type { RuntimeProcess } from "./runtime-process";

/**
 * Handlers invoked when starting/stopping a registered process (Phase 55).
 */
export interface RuntimeProcessHandlers {
  readonly start?: () => Promise<void>;
  readonly stop?: () => Promise<void>;
  readonly healthCheck?: () => Promise<boolean>;
}

export interface RuntimeProcessRegistration {
  readonly processId: string;
  readonly label: string;
  readonly handlers?: RuntimeProcessHandlers;
}

/**
 * Runtime process manager contract (Phase 55).
 */
export interface RuntimeProcessManager {
  registerProcess(registration: RuntimeProcessRegistration): void;
  startProcess(processId: string): Promise<RuntimeProcess>;
  stopProcess(processId: string): Promise<RuntimeProcess>;
  restartProcess(processId: string): Promise<RuntimeProcess>;
  getProcess(processId: string): RuntimeProcess | undefined;
  getActiveProcesses(): readonly RuntimeProcess[];
  getHealth(): RuntimeHealth;
}
