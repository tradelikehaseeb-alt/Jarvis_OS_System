import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { fadeSlideUp, panelTransition } from "../polish/motion-presets";
import type { ProductivityViewState } from "./productivity-types";
import { ProductivityTimeline } from "./ProductivityTimeline";

export interface ProductivityDashboardProps {
  readonly visible: boolean;
  readonly productivity?: ProductivityViewState;
  readonly loading?: boolean;
  readonly displayLabel?: string;
}

/**
 * Daily productivity dashboard with timeline and proactive suggestions (Phase 98).
 */
export const ProductivityDashboard = memo(function ProductivityDashboard({
  visible,
  productivity,
  loading = false,
  displayLabel,
}: ProductivityDashboardProps) {
  const complete = productivity?.completed && !loading;
  const taskCount = productivity?.taskCount ?? productivity?.activities.length ?? 0;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.section
          className="productivity-dashboard"
          data-testid="productivity-dashboard"
          aria-live="polite"
          aria-label="Daily productivity"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={panelTransition}
        >
          <div className="productivity-dashboard__glow" aria-hidden />
          <header className="productivity-dashboard__header">
            <span className="productivity-dashboard__badge">
              {complete ? "Completed." : "Daily assistant"}
            </span>
            {taskCount > 0 ? (
              <span className="productivity-dashboard__count" data-testid="productivity-task-count">
                {taskCount} tasks
              </span>
            ) : null}
          </header>

          {displayLabel ? (
            <p className="productivity-dashboard__status" data-testid="productivity-active-label">
              {loading ? <span className="spinner spinner--subtle" aria-hidden /> : null}
              {displayLabel}
            </p>
          ) : null}

          <ProductivityTimeline activities={productivity?.activities ?? []} loading={loading} />

          {productivity?.suggestions && productivity.suggestions.length > 0 ? (
            <ul className="productivity-dashboard__suggestions" data-testid="productivity-suggestions">
              {productivity.suggestions.map((suggestion, index) => (
                <li key={`${suggestion.kind}-${index}`} className="productivity-dashboard__suggestion">
                  {suggestion.message}
                </li>
              ))}
            </ul>
          ) : null}

          {productivity?.summary && complete ? (
            <p className="productivity-dashboard__summary" data-testid="productivity-summary">
              {productivity.summary}
            </p>
          ) : null}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
});
