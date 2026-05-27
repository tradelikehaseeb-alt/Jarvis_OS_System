import type { VoiceStatus } from "../voice/voice-types";
import type { TranscriptNormalizationView } from "../voice";
import type { SpeechMetadataView } from "../voice/use-mock-voice-input";

export interface VoiceTranscriptPanelProps {
  readonly status: VoiceStatus;
  readonly transcript: string;
  readonly normalization?: TranscriptNormalizationView | null;
  readonly metadata?: SpeechMetadataView | null;
  readonly error?: string | null;
  readonly visible?: boolean;
}

/**
 * Mock transcript display above chat composer (Phase 25).
 */
export function VoiceTranscriptPanel({
  status,
  transcript,
  normalization,
  metadata,
  error,
  visible = true,
}: VoiceTranscriptPanelProps) {
  if (!visible) {
    return null;
  }

  const showPanel =
    status !== "idle" || transcript.length > 0 || Boolean(error);

  if (!showPanel) {
    return null;
  }

  return (
    <section
      className="voice-transcript-panel"
      aria-label="Voice transcript"
      data-testid="voice-transcript-panel"
    >
      <header className="voice-transcript-header">
        <span>Transcript</span>
        <span className="voice-transcript-mode">Mock STT</span>
      </header>

      {error ? (
        <p className="voice-transcript-error" role="alert">
          {error}
        </p>
      ) : null}

      {status === "listening" ? (
        <p className="voice-transcript-placeholder">
          <span className="voice-wave" aria-hidden />
          Listening for speech (simulated)…
        </p>
      ) : null}

      {status === "processing" ? (
        <p className="voice-transcript-placeholder">
          Running speech gateway pipeline…
        </p>
      ) : null}

      {status === "normalizing" ? (
        <p className="voice-transcript-placeholder">
          Applying normalization rules…
        </p>
      ) : null}

      {normalization ? (
        <section
          className="voice-normalization-block"
          aria-label="Transcript normalization"
          data-testid="voice-normalization-block"
        >
          <h4 className="voice-normalization-title">Original transcript</h4>
          <p
            className="voice-transcript-text voice-transcript-original"
            data-testid="voice-transcript-original"
          >
            {normalization.original}
          </p>

          <h4 className="voice-normalization-title">Normalized transcript</h4>
          <p
            className="voice-transcript-text"
            data-testid="voice-transcript-normalized"
          >
            {normalization.normalized}
          </p>

          <details className="voice-corrections" data-testid="voice-corrections">
            <summary>
              Corrections applied ({normalization.correctionsApplied.length})
            </summary>
            {normalization.correctionsApplied.length > 0 ? (
              <ul className="voice-corrections-list">
                {normalization.correctionsApplied.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            ) : (
              <p className="voice-corrections-empty">No corrections applied.</p>
            )}
          </details>
        </section>
      ) : null}

      {metadata ? (
        <section
          className="voice-metadata-panel"
          aria-label="Speech metadata"
          data-testid="voice-metadata-panel"
        >
          <h4 className="voice-normalization-title">Speech metadata</h4>
          <dl className="voice-metadata-list">
            <dt>Detected action</dt>
            <dd data-testid="voice-metadata-action">{metadata.detectedAction}</dd>
            <dt>Normalized transcript</dt>
            <dd data-testid="voice-metadata-normalized">
              {metadata.normalizedTranscript}
            </dd>
            <dt>Conversation state</dt>
            <dd data-testid="voice-metadata-conversation-state">
              {metadata.conversationState}
            </dd>
            <dt>Provider decision</dt>
            <dd data-testid="voice-metadata-provider">{metadata.providerDecision}</dd>
            <dt>Trace summary</dt>
            <dd data-testid="voice-metadata-trace">{metadata.traceSummary}</dd>
          </dl>
        </section>
      ) : null}

      {transcript ? (
        <p className="voice-transcript-text" data-testid="voice-transcript-text">
          {transcript}
        </p>
      ) : null}

      {!transcript && status === "idle" && !error ? (
        <p className="voice-transcript-placeholder voice-transcript-muted">
          Press the microphone to generate a mock transcript.
        </p>
      ) : null}
    </section>
  );
}
