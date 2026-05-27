import type { ActivityEvent } from "./activity-event";
import { ActivityTimelineItem } from "./ActivityTimelineItem";

export interface ActivityTimelineProps {
  readonly events: readonly ActivityEvent[];
  readonly loading?: boolean;
}

/**
 * Vertical timeline of Jarvis planning and execution activity (Phase 48).
 */
export function ActivityTimeline({ events, loading }: ActivityTimelineProps) {
  if (events.length === 0 && !loading) {
    return (
      <p className="activity-panel-empty" data-testid="activity-timeline-empty">
        Activity will appear here while Jarvis works.
      </p>
    );
  }

  return (
    <ol
      className="activity-timeline"
      data-testid="activity-timeline"
      aria-busy={loading || undefined}
    >
      {events.map((event) => (
        <ActivityTimelineItem key={event.id} event={event} />
      ))}
      {loading ? (
        <li
          className="activity-timeline-item activity-timeline-item--active"
          data-testid="activity-timeline-loading"
        >
          <span className="activity-timeline-dot" aria-hidden />
          <div className="activity-timeline-content">
            <span className="spinner" aria-hidden />
            <span className="activity-timeline-label">Jarvis is working…</span>
          </div>
        </li>
      ) : null}
    </ol>
  );
}
