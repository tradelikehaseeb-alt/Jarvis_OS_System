import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { fadeSlideUp, panelTransition } from "../polish/motion-presets";
import type { WorkforceActivityViewState } from "./workforce-types";
import { WorkforceTimeline } from "./WorkforceTimeline";

export interface WorkforceActivityPanelProps {
  readonly visible: boolean;
  readonly workforce?: WorkforceActivityViewState;
  readonly loading?: boolean;
  readonly displayLabel?: string;
}

/**
 * Subtle multi-agent activity visualization for Jarvis command center (Phase 97).
 */
export const WorkforceActivityPanel = memo(function WorkforceActivityPanel({
  visible,
  workforce,
  loading = false,
  displayLabel,
}: WorkforceActivityPanelProps) {
  const complete = workforce?.completed && !loading;
  const workerCount = workforce?.workerCount ?? workforce?.activities.length ?? 0;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.section
          className="workforce-activity-panel"
          data-testid="workforce-activity-panel"
          aria-live="polite"
          aria-label="Task progress"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={panelTransition}
        >
          <div className="workforce-activity-panel__glow" aria-hidden />
          <header className="workforce-activity-panel__header">
            <span className="workforce-activity-panel__badge">
              {complete ? "Completed." : "Coordinating"}
            </span>
            {workerCount > 1 ? (
              <span className="workforce-activity-panel__count" data-testid="workforce-delegation-count">
                {workerCount} tasks
              </span>
            ) : null}
          </header>

          {displayLabel ? (
            <p className="workforce-activity-panel__status" data-testid="workforce-active-label">
              {loading ? <span className="spinner spinner--subtle" aria-hidden /> : null}
              {displayLabel}
            </p>
          ) : null}

          <WorkforceTimeline activities={workforce?.activities ?? []} loading={loading} />

          {workforce?.summary && complete ? (
            <p className="workforce-activity-panel__summary" data-testid="workforce-summary">
              {workforce.summary}
            </p>
          ) : null}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
});
