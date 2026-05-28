import { memo } from "react";

import type { WorkforceActivityView } from "./workforce-types";

export interface WorkforceTimelineProps {
  readonly activities: readonly WorkforceActivityView[];
  readonly loading?: boolean;
}

/**
 * Live workforce timeline — user-facing labels only (Phase 97).
 */
export const WorkforceTimeline = memo(function WorkforceTimeline({
  activities,
  loading = false,
}: WorkforceTimelineProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <ol className="workforce-timeline" data-testid="workforce-timeline">
      {activities.map((activity, index) => (
        <li
          key={`${activity.workerType}-${activity.timestamp}-${index}`}
          className={`workforce-timeline__item workforce-timeline__item--${
            activity.completed ? "complete" : loading ? "active" : "pending"
          }`}
          data-testid={`workforce-step-${activity.workerType}`}
        >
          <span className="workforce-timeline__label">{activity.userLabel}</span>
          {activity.message ? (
            <span className="workforce-timeline__message">{activity.message}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
});
