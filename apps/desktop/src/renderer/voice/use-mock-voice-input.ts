import { useCallback, useEffect, useRef, useState } from "react";
import {
  SpeechNormalizer,
  createDefaultSpeechConversationManager,
  createDefaultSpeechGateway,
  createDefaultSpeechTelemetry,
} from "@jarvis/speech-service";

import {
  MockVoiceSessionError,
  runMockVoiceCapture,
} from "./mock-voice-session";
import type { VoiceSettings } from "./voice-settings";
import { DEFAULT_VOICE_SETTINGS } from "./voice-settings";
import type { VoiceStatus } from "./voice-types";

const MOCK_PROCESSING_DURATION_MS = 300;

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

export interface SpeechMetadataView {
  readonly detectedAction: string;
  readonly normalizedTranscript: string;
  readonly conversationState: string;
  readonly providerDecision: string;
  readonly traceSummary: string;
}

export interface UseMockVoiceInputResult {
  readonly status: VoiceStatus;
  readonly transcript: string;
  readonly normalization: TranscriptNormalizationView | null;
  readonly metadata: SpeechMetadataView | null;
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
  const [metadata, setMetadata] = useState<SpeechMetadataView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const normalizerRef = useRef(new SpeechNormalizer());
  const gatewayRef = useRef(createDefaultSpeechGateway());
  const conversationManagerRef = useRef(createDefaultSpeechConversationManager());
  const telemetryRef = useRef(createDefaultSpeechTelemetry());
  const conversationSequenceRef = useRef(0);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setError(null);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setNormalization(null);
    setMetadata(null);
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
    setMetadata(null);
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

      telemetryRef.current.collector.clearHistory();
      const requestId = `speech-request-${Date.now()}`;
      const conversationId = `speech-conversation-${++conversationSequenceRef.current}`;
      const conversation = conversationManagerRef.current.createConversation(
        conversationId,
        {
          metadata: { source: "desktop-voice-pipeline" },
        },
      );
      telemetryRef.current.recorder.recordEvent("info", "conversation created", {
        requestId,
        conversationId: conversation.conversationId,
        component: "conversation-manager",
        metadata: { state: conversation.state },
      });

      const original = result.transcript;
      let normalized = original;
      let correctionsApplied: string[] = [];
      let normalizationApplied = false;
      let detectedAction = "none";
      let providerDecision = "stt-local";

      const gatewayResult = await gatewayRef.current.processTranscript({
        requestId,
        transcript: original,
        conversationId,
        requestedCapabilities: ["low-latency"],
        providerIds: ["stt-local", "stt-cloud"],
      });
      providerDecision = gatewayResult.routing.providerId;

      const normalizedResult = normalizerRef.current.normalize(original, {
        domain: "trading",
      });
      correctionsApplied = [
        ...normalizedResult.appliedCorrections,
        ...normalizedResult.appliedRules,
      ];
      if (settings.enableNormalization) {
        normalized = normalizedResult.normalized;
        normalizationApplied = original !== normalized;
      }

      const actionResponse = await gatewayRef.current.processAction({
        requestId,
        transcript: normalized,
        conversationId,
      });
      detectedAction = actionResponse.action?.type ?? "none";

      conversationManagerRef.current.appendUserTurn(conversationId, normalized);
      const endedConversation =
        conversationManagerRef.current.endConversation(conversationId);
      telemetryRef.current.recorder.recordEvent(
        "info",
        "gateway transcript processed",
        {
          requestId,
          conversationId,
          component: "gateway",
          metadata: {
            action: detectedAction,
            provider: providerDecision,
          },
        },
      );
      telemetryRef.current.recorder.recordMetric(
        "processing_duration",
        MOCK_PROCESSING_DURATION_MS,
        "ms",
        { stage: "gateway" },
      );
      telemetryRef.current.recorder.recordMetric(
        "normalization_corrections",
        correctionsApplied.length,
        "count",
        { enabled: String(settings.enableNormalization) },
      );
      const history = telemetryRef.current.collector.getTraceHistory();
      const traceSummary = `${history.events.length} events, ${history.metrics.length} metrics`;

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
      setMetadata({
        detectedAction,
        normalizedTranscript: normalized,
        conversationState: endedConversation.state,
        providerDecision,
        traceSummary,
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
    metadata,
    error,
    isActive: isActive || isNormalizing,
    toggleListening,
    cancel,
    clearTranscript,
  };
}
