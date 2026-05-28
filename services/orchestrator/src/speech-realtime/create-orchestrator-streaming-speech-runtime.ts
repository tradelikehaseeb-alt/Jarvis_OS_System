import {
  createDefaultStreamingSpeechRuntime,
  createRealTimeVoiceCaptureDelegate,
  createRealTimeVoiceSpeechDelegate,
  SyntheticMicrophoneRuntime,
} from "@jarvis/speech-service";

export interface CreateOrchestratorStreamingSpeechRuntimeOptions {
  readonly useSyntheticMicrophone?: boolean;
}

/**
 * Orchestrator-side streaming speech runtime for integration tests (Phase 91).
 */
export function createOrchestratorStreamingSpeechRuntime(
  options: CreateOrchestratorStreamingSpeechRuntimeOptions = {},
) {
  const microphone = options.useSyntheticMicrophone === false
    ? undefined
    : new SyntheticMicrophoneRuntime();

  const streamingRuntime = createDefaultStreamingSpeechRuntime({ microphone });
  const captureDelegate = createRealTimeVoiceCaptureDelegate({ streamingRuntime });
  const speechDelegate = createRealTimeVoiceSpeechDelegate();

  return {
    streamingRuntime,
    captureDelegate,
    speechDelegate,
  };
}
