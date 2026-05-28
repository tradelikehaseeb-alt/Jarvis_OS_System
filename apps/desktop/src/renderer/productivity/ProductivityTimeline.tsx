import { memo } from "react";

import type { ProductivityActivityView } from "./productivity-types";

export interface ProductivityTimelineProps {
  readonly activities: readonly ProductivityActivityView[];
  readonly loading?: boolean;
}

/**
 * Live productivity timeline — user-facing labels only (Phase 98).
 */
export const ProductivityTimeline = memo(function ProductivityTimeline({
  activities,
  loading = false,
}: ProductivityTimelineProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <ol className="productivity-timeline" data-testid="productivity-timeline">
      {activities.map((activity, index) => (
        <li
          key={`${activity.kind}-${activity.timestamp}-${index}`}
          className={`productivity-timeline__item productivity-timeline__item--${
            activity.completed ? "complete" : loading ? "active" : "pending"
          }`}
          data-testid={`productivity-step-${activity.kind}`}
        >
          <span className="productivity-timeline__label">{activity.userLabel}</span>
          {activity.message ? (
            <span className="productivity-timeline__message">{activity.message}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
});
