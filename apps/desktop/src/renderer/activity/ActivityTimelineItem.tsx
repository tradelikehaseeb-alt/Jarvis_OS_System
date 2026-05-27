import type { ActivityEvent } from "./activity-event";

export interface ActivityTimelineItemProps {
  readonly event: ActivityEvent;
}

/**
 * Single row in the live activity timeline (Phase 48).
 */
export function ActivityTimelineItem({ event }: ActivityTimelineItemProps) {
  return (
    <li
      className={`activity-timeline-item activity-timeline-item--${event.status}`}
      data-testid={`activity-item-${event.kind}`}
      data-status={event.status}
    >
      <span className="activity-timeline-dot" aria-hidden />
      <div className="activity-timeline-content">
        <div className="activity-timeline-label">{event.label}</div>
        {event.message ? (
          <div className="activity-timeline-message">{event.message}</div>
        ) : null}
      </div>
    </li>
  );
}
