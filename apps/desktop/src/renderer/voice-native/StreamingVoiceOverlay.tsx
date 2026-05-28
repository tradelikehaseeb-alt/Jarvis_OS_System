import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ProgressiveStreamText } from "../polish/ProgressiveStreamText";
import { fadeSlideUp, overlayTransition } from "../polish/motion-presets";

export interface StreamingVoiceOverlayProps {
  readonly visible: boolean;
  readonly streamingText: string;
  readonly partialTranscript?: string;
  readonly confidence?: number;
  readonly latencyMs?: number;
}

/**
 * Ambient overlay with smooth enter/exit transitions (Phase 92).
 */
export const StreamingVoiceOverlay = memo(function StreamingVoiceOverlay({
  visible,
  streamingText,
  partialTranscript,
  confidence,
  latencyMs,
}: StreamingVoiceOverlayProps) {
  return (
    <AnimatePresence mode="wait">
      {visible ? (
        <motion.div
          className="streaming-voice-overlay"
          data-testid="streaming-voice-overlay"
          aria-live="polite"
          aria-atomic="false"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={overlayTransition}
        >
          {partialTranscript ? (
            <motion.p
              className="streaming-voice-overlay__partial"
              data-testid="voice-partial-transcript"
              key={partialTranscript}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={overlayTransition}
            >
              {partialTranscript}
            </motion.p>
          ) : null}
          {(typeof confidence === "number" || typeof latencyMs === "number") ? (
            <div className="streaming-voice-overlay__telemetry">
              {typeof confidence === "number" ? (
                <span data-testid="overlay-transcript-confidence">
                  {Math.round(confidence * 100)}%
                </span>
              ) : null}
              {typeof latencyMs === "number" ? (
                <span data-testid="overlay-stt-latency">{latencyMs} ms</span>
              ) : null}
            </div>
          ) : null}
          <ProgressiveStreamText
            text={streamingText}
            className="streaming-voice-overlay__stream"
            testId="voice-streaming-response"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
