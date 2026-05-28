import { memo } from "react";

import type { ContinuousActivityView } from "./continuous-types";

export interface ContinuousActivityTimelineProps {
  readonly activities: readonly ContinuousActivityView[];
  readonly loading?: boolean;
}

/**
 * Continuous activity timeline — user-facing labels only (Phase 99).
 */
export const ContinuousActivityTimeline = memo(function ContinuousActivityTimeline({
  activities,
  loading = false,
}: ContinuousActivityTimelineProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <ol className="continuous-timeline" data-testid="continuous-timeline">
      {activities.map((activity, index) => (
        <li
          key={`${activity.kind}-${activity.timestamp}-${index}`}
          className={`continuous-timeline__item continuous-timeline__item--${
            activity.completed ? "complete" : loading ? "active" : "pending"
          }${activity.background ? " continuous-timeline__item--background" : ""}`}
          data-testid={`continuous-step-${activity.kind}`}
        >
          <span className="continuous-timeline__label">{activity.userLabel}</span>
          {activity.message ? (
            <span className="continuous-timeline__message">{activity.message}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
});
