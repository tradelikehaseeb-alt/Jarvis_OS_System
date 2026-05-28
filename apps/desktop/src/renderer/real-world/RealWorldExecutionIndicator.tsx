import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { fadeSlideUp, panelTransition } from "../polish/motion-presets";

export interface RealWorldExecutionIndicatorProps {
  readonly visible: boolean;
  readonly statusLabel: string;
  readonly loading?: boolean;
  readonly providerOnline?: boolean;
  readonly degraded?: boolean;
}

/**
 * Subtle real-world execution clarity indicator (Phase 100).
 */
export const RealWorldExecutionIndicator = memo(function RealWorldExecutionIndicator({
  visible,
  statusLabel,
  loading = false,
  providerOnline = true,
  degraded = false,
}: RealWorldExecutionIndicatorProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="real-world-execution-indicator"
          data-testid="real-world-execution-indicator"
          aria-live="polite"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={panelTransition}
        >
          <span
            className={`real-world-execution-indicator__dot${
              degraded
                ? " real-world-execution-indicator__dot--degraded"
                : providerOnline
                  ? " real-world-execution-indicator__dot--live"
                  : ""
            }`}
            aria-hidden
          />
          {loading ? <span className="spinner spinner--subtle" aria-hidden /> : null}
          <span className="real-world-execution-indicator__label">{statusLabel}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
