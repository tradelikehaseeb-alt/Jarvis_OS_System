import { useCallback, useEffect, useRef, useState } from "react";
import { detectWakeWordInTranscript, transcribe } from "@jarvis/speech-service";

import {
  MockVoiceSessionError,
  runMockVoiceCapture,
} from "./mock-voice-session";
import type { VoiceSettings } from "./voice-settings";
import { DEFAULT_VOICE_SETTINGS } from "./voice-settings";
import type { VoiceStatus } from "./voice-types";
import {
  startVoiceActivityDetector,
  VOICE_SILENCE_STOP_MS,
} from "./voice-activity-detector";
import { useMockVoiceInput, type UseMockVoiceInputResult } from "./use-mock-voice-input";

function isTestEnvironment(): boolean {
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

export interface UseVoiceInputOptions {
  readonly settings?: VoiceSettings;
  readonly onTranscriptReady?: (transcript: string) => void;
  readonly disabled?: boolean;
}

export interface UseVoiceInputResult {
  readonly status: VoiceStatus;
  readonly transcript: string;
  readonly isWakeWord: boolean;
  readonly isListening: boolean;
  readonly error: string | null;
  readonly toggleListening: () => void;
  readonly cancel: () => void;
  readonly clearTranscript: () => void;
}

async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Production voice input — microphone + VAD + speech-service STT.
 */
export function useVoiceInput(
  options: UseVoiceInputOptions = {},
): UseVoiceInputResult {
  const settings = options.settings ?? DEFAULT_VOICE_SETTINGS;
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [isWakeWord, setIsWakeWord] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const stopVadRef = useRef<(() => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cleanupMedia = useCallback(() => {
    stopVadRef.current?.();
    stopVadRef.current = null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    chunksRef.current = [];
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    cleanupMedia();
    setStatus("idle");
    setError(null);
  }, [cleanupMedia]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setIsWakeWord(false);
    if (status === "completed") {
      setStatus("idle");
    }
  }, [status]);

  const finalizeCapture = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    const chunks = chunksRef.current;
    cleanupMedia();

    if (!recorder || chunks.length === 0) {
      setStatus("idle");
      return;
    }

    setStatus("processing");
    const mimeType = recorder.mimeType || "audio/webm";
    const blob = new Blob(chunks, { type: mimeType });

    try {
      const audioBuffer = await blobToBuffer(blob);
      const response = await transcribe(audioBuffer, { mimeType });
      if (response.error) {
        setError(response.error.message);
        setStatus("error");
        return;
      }

      const wake =
        response.isWakeWord === true
          ? { isWakeWord: true, confidence: response.confidence ?? 0.9 }
          : detectWakeWordInTranscript(response.output);

      setTranscript(response.output);
      setIsWakeWord(wake.isWakeWord);
      setStatus("completed");
      if (settings.pushToChatInput) {
        options.onTranscriptReady?.(response.output);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Voice capture failed";
      setError(message);
      setStatus("error");
    }
  }, [cleanupMedia, options, settings.pushToChatInput]);

  const startListening = useCallback(async () => {
    if (options.disabled) {
      return;
    }

    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setTranscript("");
    setIsWakeWord(false);
    setStatus("listening");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (controller.signal.aborted) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        void finalizeCapture();
      };

      stopVadRef.current = startVoiceActivityDetector({
        analyser,
        silenceMs: VOICE_SILENCE_STOP_MS,
        onSilence: () => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        },
      });

      recorder.start(250);
    } catch (err) {
      const message =
        err instanceof MockVoiceSessionError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Microphone access denied";
      setError(message);
      setStatus("error");
      cleanupMedia();
    }
  }, [cancel, cleanupMedia, finalizeCapture, options.disabled]);

  const toggleListening = useCallback(() => {
    if (status === "listening" || status === "processing") {
      cancel();
      return;
    }
    void startListening();
  }, [cancel, startListening, status]);

  useEffect(() => () => cancel(), [cancel]);

  return {
    status,
    transcript,
    isWakeWord,
    isListening: status === "listening" || status === "processing",
    error,
    toggleListening,
    cancel,
    clearTranscript,
  };
}

/**
 * Auto-select mock hook in test, real microphone hook in production.
 * Both hooks are invoked; the inactive path stays disabled.
 */
export function useAdaptiveVoiceInput(
  options: UseVoiceInputOptions = {},
): UseVoiceInputResult | UseMockVoiceInputResult {
  const testMode = isTestEnvironment();
  const mockResult = useMockVoiceInput({
    ...options,
    disabled: options.disabled || !testMode,
  });
  const realResult = useVoiceInput({
    ...options,
    disabled: options.disabled || testMode,
  });
  return testMode ? mockResult : realResult;
}
