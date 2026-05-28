import type { VoiceSessionCaptureDelegate } from "../voice-session/create-default-voice-session-runtime";

import type { MicrophoneRuntime } from "./microphone-runtime";
import { SyntheticMicrophoneRuntime } from "./microphone-runtime";
import {
  createDefaultStreamingSpeechRuntime,
  type StreamingSpeechRuntime,
} from "./streaming-speech-runtime";

export interface RealTimeVoiceCaptureResult {
  readonly transcript: string;
  readonly partialChunks?: readonly string[];
  readonly confidence?: number;
  readonly latencyMs?: number;
}

export interface CreateRealTimeVoiceCaptureDelegateOptions {
  readonly microphone?: MicrophoneRuntime;
  readonly streamingRuntime?: StreamingSpeechRuntime;
}

/**
 * Voice session capture delegate backed by real-time microphone + streaming STT (Phase 91).
 */
export function createRealTimeVoiceCaptureDelegate(
  options: CreateRealTimeVoiceCaptureDelegateOptions = {},
): VoiceSessionCaptureDelegate & {
  readonly runtime: StreamingSpeechRuntime;
  readonly getConfidence: () => number;
  readonly getLatencyMs: () => number;
  readonly getMicLevels: () => readonly number[];
} {
  const runtime =
    options.streamingRuntime ??
    createDefaultStreamingSpeechRuntime({
      microphone: options.microphone ?? new SyntheticMicrophoneRuntime(),
    });

  const delegate: VoiceSessionCaptureDelegate & {
    readonly runtime: StreamingSpeechRuntime;
    readonly getConfidence: () => number;
    readonly getLatencyMs: () => number;
    readonly getMicLevels: () => readonly number[];
  } = {
    runtime,
    getConfidence: () => runtime.getTranscriptionSession().getConfidence(),
    getLatencyMs: () => runtime.getTranscriptionSession().getLatencyMs(),
    getMicLevels: () => runtime.getMicrophone().getLatestLevels(),
    async capture({ signal }) {
      const partialChunks: string[] = [];
      const unsubscribe = runtime.subscribe((partial) => {
        if (!partial.isFinal) {
          partialChunks.push(partial.text);
        }
      });

      try {
        await runtime.startListening(signal);
        while (!signal.aborted && runtime.getMicrophone().getLatestLevels().length < 3) {
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
        if (signal.aborted) {
          runtime.interrupt();
          throw new DOMException("Aborted", "AbortError");
        }

        const response = await runtime.finalizeTranscript(
          `voice-capture-${Date.now()}`,
        );

        return {
          transcript: response.output,
          partialChunks,
          confidence: response.confidence,
          latencyMs: response.latencyMs,
        };
      } finally {
        unsubscribe();
      }
    },
  };

  return delegate;
}
