import type { VoiceStatus } from "../voice/voice-types";

export interface VoiceButtonProps {
  readonly status: VoiceStatus;
  readonly onPress: () => void;
  readonly disabled?: boolean;
}

/**
 * Microphone control for mock voice capture (Phase 25).
 * No device access — toggles simulated listening state.
 */
export function VoiceButton({
  status,
  onPress,
  disabled = false,
}: VoiceButtonProps) {
  const isListening = status === "listening";
  const isBusy = status === "listening" || status === "processing";

  return (
    <button
      type="button"
      className={`voice-mic-btn ${isListening ? "listening" : ""} ${isBusy ? "busy" : ""}`}
      onClick={onPress}
      disabled={disabled || status === "processing"}
      aria-pressed={isListening}
      aria-label={
        isListening
          ? "Stop mock voice capture"
          : "Start mock voice capture"
      }
      title="Mock voice input (no microphone)"
      data-testid="voice-mic-button"
    >
      <span className="voice-mic-icon" aria-hidden>
        🎤
      </span>
      {isListening ? <span className="voice-mic-ring" aria-hidden /> : null}
    </button>
  );
}
