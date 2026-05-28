import type { ActivityEvent } from "../activity/activity-event";

export interface DynamicActivityPanelProps {
  readonly events: readonly ActivityEvent[];
  readonly loading?: boolean;
}

function isActiveEvent(event: ActivityEvent): boolean {
  return event.status === "active" || event.status === "pending";
}

/**
 * Shows only active capabilities/tools during execution (Phase 89).
 */
export function DynamicActivityPanel({
  events,
  loading = false,
}: DynamicActivityPanelProps) {
  const activeEvents = events.filter(isActiveEvent);

  if (!loading && activeEvents.length === 0) {
    return null;
  }

  const visible = loading && activeEvents.length === 0
    ? [{ id: "active-default", kind: "planning_started" as const, label: "Working…", timestamp: "", status: "active" as const }]
    : activeEvents;

  return (
    <section
      className="dynamic-activity-panel"
      aria-label="Active capabilities"
      data-testid="dynamic-activity-panel"
    >
      <h3 className="dynamic-activity-panel__title">Active now</h3>
      <ul className="dynamic-activity-panel__list">
        {visible.map((event) => (
          <li
            key={event.id}
            className={`dynamic-activity-item dynamic-activity-item--${event.status}`}
            data-testid={`dynamic-activity-${event.kind}`}
          >
            <span className="dynamic-activity-item__pulse" aria-hidden />
            <span>{event.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
