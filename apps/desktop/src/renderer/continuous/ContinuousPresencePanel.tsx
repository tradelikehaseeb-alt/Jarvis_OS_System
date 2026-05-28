import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { fadeSlideUp, panelTransition } from "../polish/motion-presets";
import type { ContinuousViewState } from "./continuous-types";
import { ContinuousActivityTimeline } from "./ContinuousActivityTimeline";

export interface NotificationCenterProps {
  readonly notifications: ContinuousViewState["notifications"];
}

export const NotificationCenter = memo(function NotificationCenter({
  notifications,
}: NotificationCenterProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <ul className="notification-center" data-testid="notification-center">
      {notifications.map((entry, index) => (
        <li key={`${entry.kind}-${index}`} className="notification-center__item">
          <span className="notification-center__label">{entry.userLabel}</span>
          <span className="notification-center__message">{entry.message}</span>
        </li>
      ))}
    </ul>
  );
});

export interface ContinuousPresencePanelProps {
  readonly visible: boolean;
  readonly continuous?: ContinuousViewState;
  readonly loading?: boolean;
  readonly displayLabel?: string;
}

/**
 * Subtle persistent Jarvis presence with background indicators (Phase 99).
 */
export const ContinuousPresencePanel = memo(function ContinuousPresencePanel({
  visible,
  continuous,
  loading = false,
  displayLabel,
}: ContinuousPresencePanelProps) {
  const isBackground = continuous?.presence === "background" || continuous?.continuous;
  const bgCount = continuous?.backgroundTaskCount ?? 0;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.section
          className="continuous-presence-panel"
          data-testid="continuous-presence-panel"
          aria-live="polite"
          aria-label="Jarvis presence"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={panelTransition}
        >
          <div className="continuous-presence-panel__glow" aria-hidden />
          <header className="continuous-presence-panel__header">
            <span className="continuous-presence-panel__badge">
              {isBackground ? "Active in background" : "Jarvis active"}
            </span>
            {bgCount > 0 ? (
              <span className="continuous-presence-panel__count" data-testid="background-task-count">
                {bgCount} background
              </span>
            ) : null}
          </header>

          {displayLabel ? (
            <p className="continuous-presence-panel__status" data-testid="continuous-active-label">
              {loading ? <span className="spinner spinner--subtle" aria-hidden /> : null}
              {displayLabel}
            </p>
          ) : null}

          <ContinuousActivityTimeline activities={continuous?.activities ?? []} loading={loading} />
          <NotificationCenter notifications={continuous?.notifications ?? []} />

          {continuous?.summary && !loading ? (
            <p className="continuous-presence-panel__summary" data-testid="continuous-summary">
              {continuous.summary}
            </p>
          ) : null}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
});
