import {
  createDefaultVoiceSessionRuntime,
  type VoiceSessionRuntime,
} from "@jarvis/speech-service";

import type { TaskLifecycleOperations } from "../orchestrator-service-impl";
import { createOrchestratorVoiceExecutionRuntime } from "../voice-execution/create-orchestrator-voice-execution-runtime";

export interface CreateOrchestratorVoiceSessionRuntimeOptions {
  readonly orchestrator: TaskLifecycleOperations;
}

/**
 * Voice session runtime wired to orchestrator task lifecycle (Phase 90).
 * Preserves voice → provider → Hermes → OpenClaw chain via existing execution path.
 */
export function createOrchestratorVoiceSessionRuntime(
  options: CreateOrchestratorVoiceSessionRuntimeOptions,
): VoiceSessionRuntime {
  const voiceExecutionRuntime = createOrchestratorVoiceExecutionRuntime({
    orchestrator: options.orchestrator,
  });

  return createDefaultVoiceSessionRuntime({
    voiceExecutionRuntime,
    wakeWordConfig: { phrase: "jarvis", enabled: false },
  });
}
