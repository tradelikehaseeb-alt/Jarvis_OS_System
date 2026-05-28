export interface StreamingVoiceOverlayProps {
  readonly visible: boolean;
  readonly streamingText: string;
  readonly partialTranscript?: string;
}

/**
 * Ambient overlay for live streaming voice responses (Phase 90).
 */
export function StreamingVoiceOverlay({
  visible,
  streamingText,
  partialTranscript,
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
      {streamingText ? (
        <p className="streaming-voice-overlay__stream" data-testid="voice-streaming-response">
          {streamingText}
        </p>
      ) : null}
    </div>
  );
}
