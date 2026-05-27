import type { ActivityEvent } from "./activity-event";
import { ActivityTimeline } from "./ActivityTimeline";

export interface ActivityPanelProps {
  readonly events: readonly ActivityEvent[];
  readonly loading?: boolean;
}

/**
 * Desktop panel exposing live Jarvis activity timeline (Phase 48).
 */
export function ActivityPanel({ events, loading }: ActivityPanelProps) {
  return (
    <section
      className="activity-panel"
      aria-label="Activity timeline"
      aria-busy={loading || undefined}
      data-testid="activity-panel"
    >
      <h2>Activity</h2>
      <ActivityTimeline events={events} loading={loading} />
    </section>
  );
}
