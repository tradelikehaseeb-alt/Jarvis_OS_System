import { VOICE_STATUS_LABELS, type VoiceStatus } from "../voice/voice-types";

export interface VoiceStatusIndicatorProps {
  readonly status: VoiceStatus;
  readonly error?: string | null;
}

/**
 * Voice lifecycle status line (Phase 25) — mock shell only.
 */
export function VoiceStatusIndicator({
  status,
  error,
}: VoiceStatusIndicatorProps) {
  const label = error ? error : VOICE_STATUS_LABELS[status];

  return (
    <div
      className={`voice-status voice-status-${status}`}
      role="status"
      aria-live="polite"
      data-testid="voice-status-indicator"
      data-status={status}
    >
      {status === "listening" ? (
        <span className="voice-pulse" aria-hidden />
      ) : null}
      {status === "processing" ? (
        <span className="spinner voice-status-spinner" aria-hidden />
      ) : null}
      {status === "normalizing" ? (
        <span className="spinner voice-status-spinner" aria-hidden />
      ) : null}
      <span className="voice-status-label">{label}</span>
    </div>
  );
}
