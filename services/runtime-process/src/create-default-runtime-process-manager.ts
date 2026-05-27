import { InMemoryRuntimeProcessManager } from "./in-memory-runtime-process-manager";
import type {
  RuntimeProcessHandlers,
  RuntimeProcessManager,
} from "./runtime-process-manager";

/** Default managed Jarvis runtime process identifiers (Phase 55). */
export const DEFAULT_RUNTIME_PROCESS_IDS = [
  "api-runtime",
  "orchestrator",
  "hermes-runtime",
  "openclaw-runtime",
] as const;

export type DefaultRuntimeProcessId = (typeof DEFAULT_RUNTIME_PROCESS_IDS)[number];

export interface DefaultRuntimeProcessManagerOptions {
  /** Override stub handlers for specific processes. */
  readonly processHandlers?: Partial<
    Record<DefaultRuntimeProcessId, RuntimeProcessHandlers>
  >;
}

const DEFAULT_LABELS: Record<DefaultRuntimeProcessId, string> = {
  "api-runtime": "Jarvis API Runtime",
  orchestrator: "Jarvis Orchestrator",
  "hermes-runtime": "Hermes Runtime",
  "openclaw-runtime": "OpenClaw Runtime",
};

function createStubHandlers(): RuntimeProcessHandlers {
  return {
    start: async () => {},
    stop: async () => {},
    healthCheck: async () => true,
  };
}

/**
 * Factory for the default in-memory runtime process manager (Phase 55).
 * Registers api-runtime, orchestrator, hermes-runtime, and openclaw-runtime
 * with deterministic stub handlers unless overridden.
 */
export function createDefaultRuntimeProcessManager(
  options?: DefaultRuntimeProcessManagerOptions,
): RuntimeProcessManager {
  const manager = new InMemoryRuntimeProcessManager();

  for (const processId of DEFAULT_RUNTIME_PROCESS_IDS) {
    manager.registerProcess({
      processId,
      label: DEFAULT_LABELS[processId],
      handlers:
        options?.processHandlers?.[processId] ?? createStubHandlers(),
    });
  }

  return manager;
}
