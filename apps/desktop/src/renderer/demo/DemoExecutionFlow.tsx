import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { fadeSlideUp, panelTransition } from "../polish/motion-presets";

export interface DemoExecutionFlowProps {
  readonly visible: boolean;
  readonly phase?: string;
  readonly message?: string;
  readonly progress?: number;
}

/**
 * Cinematic live execution flow indicator for demo scenarios (Phase 96).
 */
export const DemoExecutionFlow = memo(function DemoExecutionFlow({
  visible,
  phase,
  message,
  progress = 0,
}: DemoExecutionFlowProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="demo-execution-flow"
          data-testid="demo-execution-flow"
          aria-live="polite"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={panelTransition}
        >
          <div className="demo-execution-flow__glow" aria-hidden />
          <span className="demo-execution-flow__phase">{phase ?? "Live demo"}</span>
          {message ? <p className="demo-execution-flow__message">{message}</p> : null}
          <div
            className="demo-execution-flow__progress"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="demo-execution-flow__progress-fill"
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={panelTransition}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
