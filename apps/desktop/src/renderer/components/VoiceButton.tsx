import type { VoiceStatus } from "../voice/voice-types";

export interface VoiceButtonProps {
  readonly status: VoiceStatus;
  readonly onPress: () => void;
  readonly onPushToTalkDown?: () => void;
  readonly onPushToTalkUp?: () => void;
  readonly pushToTalk?: boolean;
  readonly disabled?: boolean;
  readonly useRealMicrophone?: boolean;
}

function MicIcon(): JSX.Element {
  return (
    <svg
      className="voice-mic-svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
      />
    </svg>
  );
}

/**
 * Microphone control — real Groq Whisper STT in Electron, mock in tests only.
 */
export function VoiceButton({
  status,
  onPress,
  onPushToTalkDown,
  onPushToTalkUp,
  pushToTalk = false,
  disabled = false,
  useRealMicrophone = true,
}: VoiceButtonProps) {
  const isListening = status === "listening";
  const isBusy = status === "listening" || status === "processing";
  const realMode = useRealMicrophone;
  const useHoldToTalk =
    pushToTalk &&
    typeof onPushToTalkDown === "function" &&
    typeof onPushToTalkUp === "function";

  return (
    <button
      type="button"
      className={`voice-mic-btn ${realMode ? "voice-mic-btn--live" : "voice-mic-btn--mock"} ${isListening ? "listening" : ""} ${isBusy ? "busy" : ""}`}
      onClick={useHoldToTalk ? undefined : onPress}
      onPointerDown={
        useHoldToTalk
          ? (event) => {
              if (event.button !== 0 || disabled || status === "processing") {
                return;
              }
              event.preventDefault();
              onPushToTalkDown?.();
            }
          : undefined
      }
      onPointerUp={
        useHoldToTalk
          ? () => {
              onPushToTalkUp?.();
            }
          : undefined
      }
      onPointerLeave={
        useHoldToTalk && isListening
          ? () => {
              onPushToTalkUp?.();
            }
          : undefined
      }
      disabled={disabled || status === "processing"}
      aria-pressed={isListening}
      aria-label={
        isListening
          ? realMode
            ? "Stop listening"
            : "Stop mock voice capture"
          : realMode
            ? "Start voice input"
            : "Start mock voice capture"
      }
      title={
        realMode
          ? "Voice input (Groq Whisper)"
          : "Mock voice input (tests only)"
      }
      data-testid="voice-mic-button"
    >
      <MicIcon />
      {isListening ? <span className="voice-mic-ring" aria-hidden /> : null}
    </button>
  );
}
