export interface VoiceInterruptControllerProps {
  readonly visible: boolean;
  readonly onInterrupt: () => void;
  readonly disabled?: boolean;
}

/**
 * Interrupt control while Jarvis is speaking (Phase 90 barge-in).
 */
export function VoiceInterruptController({
  visible,
  onInterrupt,
  disabled = false,
}: VoiceInterruptControllerProps) {
  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      className="voice-interrupt-controller"
      data-testid="voice-interrupt-controller"
      onClick={onInterrupt}
      disabled={disabled}
      aria-label="Interrupt Jarvis"
    >
      Stop speaking
    </button>
  );
}
