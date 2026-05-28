import type { VoiceSessionState } from "@jarvis/speech-service";

import { buildWaveformLevels } from "./voice-waveform";
import { voiceSessionLabel } from "./voice-session-labels";

export interface LiveSpeechOrbProps {
  readonly state: VoiceSessionState;
  readonly partialTranscript?: string;
  readonly active?: boolean;
  readonly micLevels?: readonly number[];
  readonly confidence?: number;
  readonly latencyMs?: number;
}

/**
 * Central animated voice orb with live microphone waveform (Phase 90 / 91).
 */
export function LiveSpeechOrb({
  state,
  partialTranscript = "",
  active = false,
  micLevels,
  confidence,
  latencyMs,
}: LiveSpeechOrbProps) {
  const levels =
    micLevels && micLevels.length > 0
      ? micLevels
      : buildWaveformLevels(partialTranscript || state, 14, active ? 1 : 0.45);
  const label = voiceSessionLabel(state);
  const speaking = state === "speaking";

  return (
    <div
      className={`live-speech-orb live-speech-orb--${state}${active ? " live-speech-orb--active" : ""}${speaking ? " live-speech-orb--speaking-animation" : ""}`}
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
            style={{ transform: `scaleY(${Math.max(0.12, level).toFixed(2)})` }}
          />
        ))}
      </div>
      <p className="live-speech-orb__label">{label}</p>
      {typeof confidence === "number" ? (
        <p className="live-speech-orb__meta" data-testid="voice-transcript-confidence">
          Confidence {Math.round(confidence * 100)}%
        </p>
      ) : null}
      {typeof latencyMs === "number" ? (
        <p className="live-speech-orb__meta" data-testid="voice-stt-latency">
          {latencyMs}ms
        </p>
      ) : null}
    </div>
  );
}
