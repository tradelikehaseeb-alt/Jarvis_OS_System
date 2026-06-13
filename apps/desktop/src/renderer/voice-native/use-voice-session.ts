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

import { MIC_WINDOWS_PRIVACY_HINT } from "../voice/microphone-access";

import { BrowserMicrophoneRuntime } from "./browser-microphone-runtime";
import { useStablePartialTranscript, useThrottledMicLevels } from "../polish";
import { playAudioBase64 } from "../utils/binary";

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
  readonly conversationId?: string;
  readonly activity?: UseActivityStreamResult;
  readonly disabled?: boolean;
  readonly speechReady?: boolean;
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
  readonly micBlocked: boolean;
  readonly isRequestingMic: boolean;
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
  const [micBlocked, setMicBlocked] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [micLevels, setMicLevels] = useState<readonly number[]>([]);
  const micRequestInFlightRef = useRef(false);
  const lastReportedErrorRef = useRef<string | null>(null);
  const [transcriptConfidence, setTranscriptConfidence] = useState<number | undefined>();
  const [sttLatencyMs, setSttLatencyMs] = useState<number | undefined>();
  const realTimeCaptureRef = useRef<ReturnType<typeof createRealTimeVoiceCaptureDelegate> | null>(
    null,
  );
  const listeningStartedAtRef = useRef<number | null>(null);
  const silentRetryCountRef = useRef(0);
  const partialTranscriptRef = useRef("");
  const MAX_SILENT_CAPTURE_RETRIES = 2;
  const audioResumeAttemptsRef = useRef(0);
  const MAX_AUDIO_RESUME_ATTEMPTS = 4;
  const activeTtsAudioRef = useRef<HTMLAudioElement | null>(null);

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
          conversationId: options.conversationId,
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
    if (!useRealMicrophone || isVoiceTestEnvironment()) {
      return;
    }

    const unsubscribeStream = window.jarvis.onSpeechPlaybackStream((payload) => {
      if (!payload.audioBase64?.trim()) {
        return;
      }
      activeTtsAudioRef.current?.pause();
      activeTtsAudioRef.current = playAudioBase64(
        payload.audioBase64,
        payload.mimeType ?? "audio/mpeg",
      );
    });

    const unsubscribeStop = window.jarvis.onSpeechPlaybackStop(() => {
      activeTtsAudioRef.current?.pause();
      activeTtsAudioRef.current = null;
    });

    return () => {
      unsubscribeStream();
      unsubscribeStop();
      activeTtsAudioRef.current?.pause();
      activeTtsAudioRef.current = null;
    };
  }, [useRealMicrophone]);

  useEffect(() => {
    runtimeRef.current.setMode(settings.listeningMode);
  }, [settings.listeningMode]);

  useEffect(() => {
    if (
      options.disabled ||
      isVoiceTestEnvironment() ||
      !useRealMicrophone ||
      options.speechReady === false
    ) {
      return;
    }
    if (settings.listeningMode === "wake-word" && settings.wakeWordEnabled) {
      void runtimeRef.current.startWakeWordListening().catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : MIC_WINDOWS_PRIVACY_HINT;
        setError(message);
        if (lastReportedErrorRef.current !== message) {
          lastReportedErrorRef.current = message;
          options.onError?.(message);
        }
      });
      return;
    }
    if (settings.listeningMode === "continuous") {
      void runtimeRef.current.startContinuousListening();
    }
  }, [
    options.disabled,
    options.onError,
    options.speechReady,
    settings.listeningMode,
    settings.wakeWordEnabled,
    useRealMicrophone,
  ]);

  useEffect(() => {
    partialTranscriptRef.current = partialTranscript;
  }, [partialTranscript]);

  useEffect(() => {
    if (sessionState !== "listening" || !useRealMicrophone || !realTimeCaptureRef.current) {
      if (sessionState !== "listening") {
        listeningStartedAtRef.current = null;
        silentRetryCountRef.current = 0;
      }
      return;
    }

    if (listeningStartedAtRef.current === null) {
      listeningStartedAtRef.current = Date.now();
      silentRetryCountRef.current = 0;
    }

    const stallTimer = window.setInterval(() => {
      const capture = realTimeCaptureRef.current;
      const startedAt = listeningStartedAtRef.current;
      if (!capture || !startedAt) {
        return;
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < 2_000) {
        return;
      }

      const levels = capture.getMicLevels();
      const peak = levels.length > 0 ? Math.max(...levels) : 0;
      if (peak > 0.04 || partialTranscriptRef.current.trim().length > 0) {
        return;
      }

      if (silentRetryCountRef.current >= MAX_SILENT_CAPTURE_RETRIES) {
        const message =
          "No microphone input detected. Check Windows privacy settings and your audio device.";
        setError(message);
        setMicBlocked(true);
        setIsRequestingMic(false);
        runtimeRef.current.stopListening();
        if (lastReportedErrorRef.current !== message) {
          lastReportedErrorRef.current = message;
          options.onError?.(message);
        }
        return;
      }

      silentRetryCountRef.current += 1;
      void capture.runtime.interrupt();
      void capture.runtime.startListening().then(() => {
        listeningStartedAtRef.current = Date.now();
      });
    }, 800);

    return () => window.clearInterval(stallTimer);
  }, [options.onError, sessionState, useRealMicrophone]);

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
      const latency = capture.getLatencyMs() ?? 0;
      setSttLatencyMs(latency);

      const microphone = capture.runtime.getMicrophone();
      if (!(microphone instanceof BrowserMicrophoneRuntime)) {
        return;
      }

      const packetDeltaMs = microphone.getLastPacketDeltaMs();
      const peak =
        capture.getMicLevels().length > 0 ? Math.max(...capture.getMicLevels()) : 0;
      const stalledCapture =
        latency === 0 && packetDeltaMs === 0 && peak < 0.02 && sessionState === "listening";

      if (stalledCapture && audioResumeAttemptsRef.current < MAX_AUDIO_RESUME_ATTEMPTS) {
        audioResumeAttemptsRef.current += 1;
        void microphone.resumeAudioContextIfStalled();
      }
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
        const permissionLike =
          event.error.includes("denied") ||
          event.error.includes("Privacy") ||
          event.error.includes("No microphone");
        if (permissionLike) {
          setMicBlocked(true);
        }
        setIsRequestingMic(false);
        micRequestInFlightRef.current = false;
        if (lastReportedErrorRef.current !== event.error) {
          lastReportedErrorRef.current = event.error;
          options.onError?.(event.error);
        }
      }
      if (event.state === "listening") {
        setIsRequestingMic(true);
        setMicBlocked(false);
        setError(null);
        lastReportedErrorRef.current = null;
        listeningStartedAtRef.current = Date.now();
        silentRetryCountRef.current = 0;
        audioResumeAttemptsRef.current = 0;
        const microphone = realTimeCaptureRef.current?.runtime.getMicrophone();
        if (microphone instanceof BrowserMicrophoneRuntime) {
          void microphone.resumeAudioContextIfStalled();
        }
      }
      if (event.state === "idle" && !event.error) {
        setIsRequestingMic(false);
        micRequestInFlightRef.current = false;
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
    if (options.disabled || micBlocked || micRequestInFlightRef.current) {
      return;
    }
    if (sessionState === "listening") {
      if (mode === "push-to-talk") {
        runtimeRef.current.pushToTalkEnd();
      } else {
        runtimeRef.current.stopListening();
      }
      return;
    }
    if (mode === "wake-word") {
      void runtimeRef.current.startWakeWordListening();
      return;
    }
    if (mode === "continuous") {
      void runtimeRef.current.startContinuousListening();
      return;
    }
    void runtimeRef.current.pushToTalkStart();
  }, [micBlocked, mode, options.disabled, sessionState]);

  const pushToTalkDown = useCallback(() => {
    if (options.disabled || micRequestInFlightRef.current) {
      return;
    }
    micRequestInFlightRef.current = true;
    setIsRequestingMic(true);
    setError(null);
    setMicBlocked(false);
    lastReportedErrorRef.current = null;
    void runtimeRef.current.pushToTalkStart().catch((err: unknown) => {
      const message =
        err instanceof Error ? err.message : MIC_WINDOWS_PRIVACY_HINT;
      setError(message);
      setMicBlocked(true);
      setIsRequestingMic(false);
      micRequestInFlightRef.current = false;
      if (lastReportedErrorRef.current !== message) {
        lastReportedErrorRef.current = message;
        options.onError?.(message);
      }
    });
  }, [micBlocked, options.disabled, options.onError]);

  const pushToTalkUp = useCallback(() => {
    runtimeRef.current.pushToTalkEnd();
    setIsRequestingMic(false);
    micRequestInFlightRef.current = false;
  }, []);

  const interruptSpeaking = useCallback(() => {
    runtimeRef.current.interruptSpeaking("user-barge-in");
    setStreamingResponse("");
    activeTtsAudioRef.current?.pause();
    activeTtsAudioRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    runtimeRef.current.stopListening();
    runtimeRef.current.interruptSpeaking("cancelled");
    setError(null);
    setMicBlocked(false);
    setIsRequestingMic(false);
    micRequestInFlightRef.current = false;
    lastReportedErrorRef.current = null;
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
    micBlocked,
    isRequestingMic,
  };
}
