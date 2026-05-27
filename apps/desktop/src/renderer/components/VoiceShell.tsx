import type { UseMockVoiceInputResult } from "../voice/use-mock-voice-input";
import type { VoiceSettings } from "../voice/voice-settings";

import { VoiceButton } from "./VoiceButton";
import { VoiceStatusIndicator } from "./VoiceStatusIndicator";
import { VoiceTranscriptPanel } from "./VoiceTranscriptPanel";

export type VoiceShellVariant = "full" | "chat";

export interface VoiceShellProps {
  readonly voice: UseMockVoiceInputResult;
  readonly settings: VoiceSettings;
  readonly disabled?: boolean;
  /**
   * `full` — transcript + mic + status (Voice page).
   * `chat` — transcript panel only; mic lives in {@link ChatInput}.
   */
  readonly variant?: VoiceShellVariant;
}

/**
 * Voice UI shell — mic, status, transcript panel (Phase 25).
 */
export function VoiceShell({
  voice,
  settings,
  disabled = false,
  variant = "full",
}: VoiceShellProps) {
  const showTranscript = settings.showTranscriptPanel;

  return (
    <div
      className={`voice-shell voice-shell-${variant}`}
      data-testid="voice-shell"
    >
      {showTranscript ? (
        <VoiceTranscriptPanel
          status={voice.status}
          transcript={voice.transcript}
          normalization={voice.normalization}
          metadata={voice.metadata}
          error={voice.error}
        />
      ) : null}

      {variant === "full" ? (
        <div className="voice-shell-controls">
          <VoiceButton
            status={voice.status}
            onPress={voice.toggleListening}
            disabled={disabled}
          />
          <VoiceStatusIndicator status={voice.status} error={voice.error} />
        </div>
      ) : null}
    </div>
  );
}
