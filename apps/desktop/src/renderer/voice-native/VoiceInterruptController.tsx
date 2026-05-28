import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { fadeSlideUp, overlayTransition } from "../polish/motion-presets";

export interface VoiceInterruptControllerProps {
  readonly visible: boolean;
  readonly onInterrupt: () => void;
  readonly disabled?: boolean;
}

/**
 * Interrupt control with smooth fade (Phase 92).
 */
export const VoiceInterruptController = memo(function VoiceInterruptController({
  visible,
  onInterrupt,
  disabled = false,
}: VoiceInterruptControllerProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          className="voice-interrupt-controller"
          data-testid="voice-interrupt-controller"
          onClick={onInterrupt}
          disabled={disabled}
          aria-label="Interrupt Jarvis"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={overlayTransition}
        >
          Stop speaking
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
});
