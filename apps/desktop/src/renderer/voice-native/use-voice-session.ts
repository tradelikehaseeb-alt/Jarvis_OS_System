import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultVoiceSessionRuntime,
  createDefaultStreamingSpeechRuntime,
  createRealTimeVoiceCaptureDelegate,
  createRealTimeVoiceSpeechDelegate,
  type VoiceSessionRuntime,
  type VoiceSessionState,
  type WakeWordState,
} from "@jarvis/speech-service";
import type { TaskStatusResponse } from "@jarvis/types";

import type { UseActivityStreamResult } from "../activity";
import { submitChatAsTask } from "../api/jarvis-client";
import { classifyChatIntent } from "../intent";
import {
  MOCK_VOICE_LISTEN_MS,
  runMockVoiceCapture,
} from "../voice/mock-voice-session";
import type { VoiceSettings } from "../voice/voice-settings";
import { DEFAULT_VOICE_SETTINGS } from "../voice/voice-settings";
import type { VoiceStatus } from "../voice/voice-types";

import { BrowserMicrophoneRuntime } from "./browser-microphone-runtime";
import { useStablePartialTranscript, useThrottledMicLevels } from "../polish";

function isVoiceTestEnvironment(): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    return true;
  }
  if (typeof import.meta !== "undefined") {
    const env = import.meta as ImportMeta & {
      env?: { MODE?: string; NODE_ENV?: string };
    };
    return env.env?.MODE === "test" || env.env?.NODE_ENV === "test";
  }
  return false;
}

function mapSessionStateToVoiceStatus(state: VoiceSessionState): VoiceStatus {
  switch (state) {
    case "listening":
      return "listening";
    case "thinking":
      return "processing";
    case "executing":
      return "processing";
    case "speaking":
      return "completed";
    case "error":
      return "error";
    default:
      return "idle";
  }
}

export interface UseVoiceSessionOptions {
  readonly settings?: VoiceSettings;
  readonly activity?: UseActivityStreamResult;
  readonly disabled?: boolean;
  readonly onTranscriptReady?: (transcript: string) => void;
  readonly onCommandRecognized?: (transcript: string) => void;
  readonly onExecutionComplete?: (status: TaskStatusResponse) => void;
  readonly onError?: (message: string) => void;
}

export interface UseVoiceSessionResult {
  readonly sessionState: VoiceSessionState;
  readonly wakeWordState: WakeWordState;
  readonly partialTranscript: string;
  readonly streamingResponse: string;
  readonly status: VoiceStatus;
  readonly transcript: string;
  readonly error: string | null;
  readonly isActive: boolean;
  readonly isSpeaking: boolean;
  readonly micLevels: readonly number[];
  readonly transcriptConfidence?: number;
  readonly sttLatencyMs?: number;
  readonly toggleListening: () => void;
  readonly pushToTalkDown: () => void;
  readonly pushToTalkUp: () => void;
  readonly interruptSpeaking: () => void;
  readonly cancel: () => void;
  readonly clearTranscript: () => void;
}

/**
 * Voice-native session hook — VoiceSessionRuntime + existing API execution path (Phase 90).
 */
export function useVoiceSession(
  options: UseVoiceSessionOptions = {},
): UseVoiceSessionResult {
  const settings = options.settings ?? DEFAULT_VOICE_SETTINGS;
  const useRealMicrophone =
    settings.useRealMicrophone && !isVoiceTestEnvironment();
  const [sessionState, setSessionState] = useState<VoiceSessionState>("idle");
  const [wakeWordState, setWakeWordState] = useState<WakeWordState>("idle");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [micLevels, setMicLevels] = useState<readonly number[]>([]);
  const [transcriptConfidence, setTranscriptConfidence] = useState<number | undefined>();
  const [sttLatencyMs, setSttLatencyMs] = useState<number | undefined>();
  const realTimeCaptureRef = useRef<ReturnType<typeof createRealTimeVoiceCaptureDelegate> | null>(
    null,
  );

  const runtimeRef = useRef<VoiceSessionRuntime>(
    createDefaultVoiceSessionRuntime({
      mode: settings.listeningMode,
      wakeWordConfig: {
        phrase: settings.wakePhrase,
        enabled: settings.wakeWordEnabled,
      },
      captureDelegate: useRealMicrophone
        ? (() => {
            const streamingRuntime = createDefaultStreamingSpeechRuntime({
              microphone: new BrowserMicrophoneRuntime(),
            });
            const capture = createRealTimeVoiceCaptureDelegate({ streamingRuntime });
            realTimeCaptureRef.current = capture;
            return capture;
          })()
        : {
            async capture({ signal }) {
              if (settings.simulateCaptureError) {
                throw new Error("Mock voice capture failed");
              }
              const result = await runMockVoiceCapture({
                listenMs: MOCK_VOICE_LISTEN_MS,
                signal,
              });
              const partialChunks = result.transcript
                .split(/\s+/)
                .map((word, index, words) =>
                  index < words.length - 1 ? `${word} ` : word,
                );
              return {
                transcript: result.transcript,
                partialChunks,
              };
            },
          },
      speechDelegate: useRealMicrophone
        ? createRealTimeVoiceSpeechDelegate()
        : undefined,
      taskExecutor: async (input) => {
        const classification = classifyChatIntent(input.normalizedText);
        const { create, status } = await submitChatAsTask(input.normalizedText, {
          classification,
        });

        options.activity?.startStream(classification.intent);
        options.activity?.ingestTaskStatus(status);
        options.onExecutionComplete?.(status);

        if (status.status === "failed") {
          return {
            taskId: create.taskId,
            taskStatus: {
              ...status,
              output: {
                ...status.output,
                summary: status.error?.message ?? "Task failed",
              },
            },
            classification: {
              intent: classification.intent,
              ruleId: classification.ruleId,
              confidence: classification.confidence,
              reason: classification.reason,
            },
            activityStream: status.output?.activityStream,
            error: {
              code: status.error?.code ?? "TASK_FAILED",
              message: status.error?.message ?? "Voice task failed",
            },
          };
        }

        return {
          taskId: create.taskId,
          taskStatus: {
            ...status,
            output: {
              ...status.output,
              summary: status.output?.summary ?? "Complete.",
            },
          },
          classification: {
            intent: classification.intent,
            ruleId: classification.ruleId,
            confidence: classification.confidence,
            reason: classification.reason,
          },
          activityStream: status.output?.activityStream,
        };
      },
    }),
  );

  useEffect(() => {
    runtimeRef.current.setMode(settings.listeningMode);
  }, [settings.listeningMode]);

  useEffect(() => {
    if (sessionState !== "listening" || !realTimeCaptureRef.current) {
      return;
    }
    const timer = window.setInterval(() => {
      const capture = realTimeCaptureRef.current;
      if (!capture) {
        return;
      }
      setMicLevels([...capture.getMicLevels()]);
      setTranscriptConfidence(capture.getConfidence());
      setSttLatencyMs(capture.getLatencyMs());
    }, 120);
    return () => window.clearInterval(timer);
  }, [sessionState]);

  const stablePartialTranscript = useStablePartialTranscript(partialTranscript);
  const throttledMicLevels = useThrottledMicLevels(micLevels, 120);

  useEffect(() => {
    const unsubscribe = runtimeRef.current.subscribe((event) => {
      setSessionState(event.state);
      setWakeWordState(event.wakeWordState);
      setPartialTranscript(event.partialTranscript);
      setStreamingResponse(event.streamingResponse);
      if (event.error) {
        setError(event.error);
        options.onError?.(event.error);
      }
      if (event.state === "thinking" && event.partialTranscript) {
        setTranscript(event.partialTranscript);
      }
      if (event.state === "executing" && event.partialTranscript) {
        options.onCommandRecognized?.(event.partialTranscript);
      }
      if (event.state === "idle" && event.partialTranscript) {
        setTranscript(event.partialTranscript);
        if (settings.pushToChatInput) {
          options.onTranscriptReady?.(event.partialTranscript);
        }
      }
    });
    return unsubscribe;
  }, [options, settings.pushToChatInput]);

  const mode = settings.listeningMode;

  const toggleListening = useCallback(() => {
    if (options.disabled) {
      return;
    }
    if (sessionState === "listening") {
      runtimeRef.current.stopListening();
      return;
    }
    if (mode === "continuous" || mode === "wake-word") {
      void runtimeRef.current.startContinuousListening();
      return;
    }
    void runtimeRef.current.pushToTalkStart();
  }, [mode, options.disabled, sessionState]);

  const pushToTalkDown = useCallback(() => {
    if (options.disabled) {
      return;
    }
    setError(null);
    void runtimeRef.current.pushToTalkStart();
  }, [options.disabled]);

  const pushToTalkUp = useCallback(() => {
    runtimeRef.current.pushToTalkEnd();
  }, []);

  const interruptSpeaking = useCallback(() => {
    runtimeRef.current.interruptSpeaking("user-barge-in");
    setStreamingResponse("");
  }, []);

  const cancel = useCallback(() => {
    runtimeRef.current.stopListening();
    runtimeRef.current.interruptSpeaking("cancelled");
    setError(null);
    setSessionState("idle");
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setPartialTranscript("");
    setStreamingResponse("");
  }, []);

  const status = useMemo(
    () => mapSessionStateToVoiceStatus(sessionState),
    [sessionState],
  );

  const isActive =
    sessionState === "listening" ||
    sessionState === "thinking" ||
    sessionState === "executing";

  const isSpeaking = sessionState === "speaking";

  return {
    sessionState,
    wakeWordState,
    partialTranscript: stablePartialTranscript,
    streamingResponse,
    status,
    transcript,
    error,
    isActive,
    isSpeaking,
    micLevels: throttledMicLevels,
    transcriptConfidence,
    sttLatencyMs,
    toggleListening,
    pushToTalkDown,
    pushToTalkUp,
    interruptSpeaking,
    cancel,
    clearTranscript,
  };
}
