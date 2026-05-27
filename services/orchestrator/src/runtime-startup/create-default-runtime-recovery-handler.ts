import type {
  RuntimeRecoveryContext,
  RuntimeRecoveryHandler,
  RuntimeRecoveryResult,
} from "./runtime-recovery-handler";
import type { RuntimeStartupEvent } from "./runtime-startup-event";

export interface CreateDefaultRuntimeRecoveryHandlerOptions {
  readonly restartProcess?: (processId: string) => Promise<boolean>;
}

let eventCounter = 0;

function nextEventId(): string {
  eventCounter += 1;
  return `runtime-recovery-${eventCounter}`;
}

function buildEvent(
  kind: RuntimeStartupEvent["kind"],
  message: string,
  processId?: string,
): RuntimeStartupEvent {
  return {
    id: nextEventId(),
    kind,
    message,
    timestamp: new Date().toISOString(),
    processId,
  };
}

/**
 * Default recovery handler — restarts failed managed processes when possible.
 */
export function createDefaultRuntimeRecoveryHandler(
  options: CreateDefaultRuntimeRecoveryHandlerOptions = {},
): RuntimeRecoveryHandler {
  return {
    async recover(context: RuntimeRecoveryContext): Promise<RuntimeRecoveryResult> {
      if (context.failedProcesses.length === 0) {
        const event = buildEvent("recovery_completed", "No recovery required");
        return {
          action: "none",
          processIds: [],
          message: event.message,
          recovered: true,
          event,
        };
      }

      const restartProcess = options.restartProcess;
      if (!restartProcess) {
        const event = buildEvent(
          "failed",
          `Recovery unavailable: ${context.reason}`,
        );
        return {
          action: "none",
          processIds: context.failedProcesses,
          message: event.message,
          recovered: false,
          event,
        };
      }

      const restarted: string[] = [];
      for (const processId of context.failedProcesses) {
        const ok = await restartProcess(processId);
        if (ok) {
          restarted.push(processId);
        }
      }

      const recovered = restarted.length === context.failedProcesses.length;
      const event = buildEvent(
        recovered ? "recovery_completed" : "degraded",
        recovered
          ? `Recovered ${restarted.length} process(es)`
          : `Partial recovery: ${restarted.length}/${context.failedProcesses.length}`,
      );

      return {
        action: "restart_processes",
        processIds: restarted,
        message: event.message,
        recovered,
        event,
      };
    },
  };
}
