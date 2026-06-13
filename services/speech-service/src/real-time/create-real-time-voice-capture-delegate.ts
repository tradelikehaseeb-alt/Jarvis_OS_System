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
    async capture({ mode, signal }) {
      const partialChunks: string[] = [];
      const unsubscribe = runtime.subscribe((partial) => {
        if (!partial.isFinal) {
          partialChunks.push(partial.text);
        }
      });

      const listenSegmentMs =
        mode === "wake-word" ? 5_500 : mode === "continuous" ? 6_500 : 0;
      const maxSilentRetries = mode === "push-to-talk" ? 0 : 2;

      try {
        for (let attempt = 0; attempt <= maxSilentRetries; attempt += 1) {
          await runtime.startListening(signal);
          while (!signal.aborted && runtime.getMicrophone().getLatestLevels().length < 2) {
            await new Promise((resolve) => setTimeout(resolve, 40));
          }
          if (listenSegmentMs > 0) {
            const startedAt = Date.now();
            while (!signal.aborted && Date.now() - startedAt < listenSegmentMs) {
              await new Promise((resolve) => setTimeout(resolve, 80));
            }
          } else {
            while (!signal.aborted) {
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }

          const response = await runtime.finalizeTranscript(
            `voice-capture-${Date.now()}-a${attempt}`,
          );
          const transcript = response.output.trim();
          const emptyBuffer = response.error?.code === "EMPTY_AUDIO_BUFFER";
          if (transcript || signal.aborted) {
            if (!transcript) {
              return { transcript: "", partialChunks };
            }
            return {
              transcript,
              partialChunks,
              confidence: response.confidence,
              latencyMs: response.latencyMs,
            };
          }
          if (!emptyBuffer && (response.stub || response.error)) {
            throw new Error(
              response.error?.message ?? "Speech recognition returned no transcript",
            );
          }
          if (attempt < maxSilentRetries && !signal.aborted) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            continue;
          }
          if (mode === "wake-word" || mode === "continuous") {
            return { transcript: "", partialChunks };
          }
          return { transcript: "", partialChunks };
        }

        return { transcript: "", partialChunks };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          runtime.interrupt();
        }
        throw error;
      } finally {
        unsubscribe();
      }
    },
  };

  return delegate;
}
