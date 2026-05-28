import type { VoiceSessionState } from "@jarvis/speech-service";

import { buildWaveformLevels } from "./voice-waveform";
import { voiceSessionLabel } from "./voice-session-labels";

export interface LiveSpeechOrbProps {
  readonly state: VoiceSessionState;
  readonly partialTranscript?: string;
  readonly active?: boolean;
}

/**
 * Central animated voice orb with waveform — cinematic Jarvis presence (Phase 90).
 */
export function LiveSpeechOrb({
  state,
  partialTranscript = "",
  active = false,
}: LiveSpeechOrbProps) {
  const waveformSeed = partialTranscript || state;
  const levels = buildWaveformLevels(waveformSeed, 14, active ? 1 : 0.45);
  const label = voiceSessionLabel(state);

  return (
    <div
      className={`live-speech-orb live-speech-orb--${state}${active ? " live-speech-orb--active" : ""}`}
      data-testid="live-speech-orb"
      data-state={state}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="live-speech-orb__glow" aria-hidden />
      <div className="live-speech-orb__core" aria-hidden />
      <div className="live-speech-orb__waveform" aria-hidden>
        {levels.map((level, index) => (
          <span
            key={`wave-${index}`}
            className="live-speech-orb__bar"
            style={{ transform: `scaleY(${level.toFixed(2)})` }}
          />
        ))}
      </div>
      <p className="live-speech-orb__label">{label}</p>
    </div>
  );
}
