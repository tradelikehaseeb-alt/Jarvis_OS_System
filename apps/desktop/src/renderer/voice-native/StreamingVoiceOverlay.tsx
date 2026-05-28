export interface StreamingVoiceOverlayProps {
  readonly visible: boolean;
  readonly streamingText: string;
  readonly partialTranscript?: string;
  readonly confidence?: number;
  readonly latencyMs?: number;
}

/**
 * Ambient overlay for live streaming voice responses (Phase 90 / 91).
 */
export function StreamingVoiceOverlay({
  visible,
  streamingText,
  partialTranscript,
  confidence,
  latencyMs,
}: StreamingVoiceOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="streaming-voice-overlay"
      data-testid="streaming-voice-overlay"
      aria-live="polite"
      aria-atomic="false"
    >
      {partialTranscript ? (
        <p className="streaming-voice-overlay__partial" data-testid="voice-partial-transcript">
          {partialTranscript}
        </p>
      ) : null}
      {typeof confidence === "number" ? (
        <p className="streaming-voice-overlay__meta" data-testid="overlay-transcript-confidence">
          Confidence {Math.round(confidence * 100)}%
        </p>
      ) : null}
      {typeof latencyMs === "number" ? (
        <p className="streaming-voice-overlay__meta" data-testid="overlay-stt-latency">
          Latency {latencyMs}ms
        </p>
      ) : null}
      {streamingText ? (
        <p className="streaming-voice-overlay__stream" data-testid="voice-streaming-response">
          {streamingText}
        </p>
      ) : null}
    </div>
  );
}
