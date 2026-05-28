import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { VoiceSessionState } from "@jarvis/speech-service";

import { WaveformBars } from "../polish/WaveformBars";
import { fadeScale, orbPulse, panelTransition } from "../polish/motion-presets";
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
 * Central animated voice orb with Framer Motion polish (Phase 92).
 */
export const LiveSpeechOrb = memo(function LiveSpeechOrb({
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
    <motion.div
      className={`live-speech-orb live-speech-orb--${state}${active ? " live-speech-orb--active" : ""}${speaking ? " live-speech-orb--speaking-animation" : ""}`}
      data-testid="live-speech-orb"
      data-state={state}
      role="status"
      aria-live="polite"
      aria-label={label}
      variants={fadeScale}
      initial="hidden"
      animate="visible"
      transition={panelTransition}
    >
      <motion.div
        className="live-speech-orb__glow"
        aria-hidden
        variants={orbPulse}
        animate={active || speaking ? "active" : "idle"}
      />
      <motion.div
        className="live-speech-orb__core"
        aria-hidden
        animate={{
          scale: speaking ? [1, 1.03, 1] : active ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: speaking ? 0.9 : 1.6,
          repeat: active || speaking ? Infinity : 0,
          ease: "easeInOut",
        }}
      />
      <WaveformBars levels={levels} />
      <p className="live-speech-orb__label">{label}</p>
      {typeof confidence === "number" ? (
        <p className="live-speech-orb__meta" data-testid="voice-transcript-confidence">
          {Math.round(confidence * 100)}% confident
        </p>
      ) : null}
      {typeof latencyMs === "number" ? (
        <p className="live-speech-orb__meta" data-testid="voice-stt-latency">
          {latencyMs} ms
        </p>
      ) : null}
    </motion.div>
  );
});
