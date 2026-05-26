import { useCallback, useEffect, useRef, useState } from "react";
import { SpeechNormalizer } from "@jarvis/speech-service";

import {
  MockVoiceSessionError,
  runMockVoiceCapture,
} from "./mock-voice-session";
import type { VoiceSettings } from "./voice-settings";
import { DEFAULT_VOICE_SETTINGS } from "./voice-settings";
import type { VoiceStatus } from "./voice-types";

export interface UseMockVoiceInputOptions {
  readonly settings?: VoiceSettings;
  /** Called when mock capture succeeds — typically updates ChatInput value. */
  readonly onTranscriptReady?: (transcript: string) => void;
  /** Optional callback with full normalization view for UI/debug consumers. */
  readonly onNormalizationReady?: (view: TranscriptNormalizationView) => void;
  readonly disabled?: boolean;
}

export interface TranscriptNormalizationView {
  readonly original: string;
  readonly normalized: string;
  readonly correctionsApplied: readonly string[];
  readonly normalizationApplied: boolean;
}

export interface UseMockVoiceInputResult {
  readonly status: VoiceStatus;
  readonly transcript: string;
  readonly normalization: TranscriptNormalizationView | null;
  readonly error: string | null;
  readonly isActive: boolean;
  readonly toggleListening: () => void;
  readonly cancel: () => void;
  readonly clearTranscript: () => void;
}

/**
 * Mock voice input hook — timers only, no microphone (Phase 25).
 */
export function useMockVoiceInput(
  options: UseMockVoiceInputOptions = {},
): UseMockVoiceInputResult {
  const settings = options.settings ?? DEFAULT_VOICE_SETTINGS;
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [normalization, setNormalization] =
    useState<TranscriptNormalizationView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const normalizerRef = useRef(new SpeechNormalizer());

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setError(null);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setNormalization(null);
    if (status === "completed") {
      setStatus("idle");
    }
  }, [status]);

  const startListening = useCallback(async () => {
    if (options.disabled) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setTranscript("");
    setNormalization(null);
    setStatus("listening");

    try {
      const result = await runMockVoiceCapture({
        simulateError: settings.simulateCaptureError,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setStatus("processing");

      // Brief processing beat so the UI shows both states.
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (controller.signal.aborted) {
        return;
      }
      setStatus("normalizing");

      const original = result.transcript;
      let normalized = original;
      let correctionsApplied: string[] = [];
      let normalizationApplied = false;

      if (settings.enableNormalization) {
        const normalizedResult = normalizerRef.current.normalize(original, {
          domain: "trading",
        });
        normalized = normalizedResult.normalized;
        correctionsApplied = [
          ...normalizedResult.appliedCorrections,
          ...normalizedResult.appliedRules,
        ];
        normalizationApplied = original !== normalized;
      }

      setNormalization({
        original,
        normalized,
        correctionsApplied,
        normalizationApplied,
      });
      options.onNormalizationReady?.({
        original,
        normalized,
        correctionsApplied,
        normalizationApplied,
      });
      setTranscript(normalized);
      setStatus("completed");

      if (settings.pushToChatInput) {
        options.onTranscriptReady?.(normalized);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      const message =
        err instanceof MockVoiceSessionError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Voice capture failed";
      setError(message);
      setStatus("error");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [
    options.disabled,
    options.onNormalizationReady,
    options.onTranscriptReady,
    settings,
  ]);

  const toggleListening = useCallback(() => {
    if (status === "listening" || status === "processing") {
      cancel();
      return;
    }
    void startListening();
  }, [cancel, startListening, status]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const isActive = status === "listening" || status === "processing";
  const isNormalizing = status === "normalizing";

  return {
    status,
    transcript,
    normalization,
    error,
    isActive: isActive || isNormalizing,
    toggleListening,
    cancel,
    clearTranscript,
  };
}
