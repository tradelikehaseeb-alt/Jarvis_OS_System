import { aggregateStatusLabel } from "./derive-runtime-status";
import { RuntimeHealthCard } from "./RuntimeHealthCard";
import type { RuntimeHealthEvent } from "./runtime-health-event";
import type { RuntimeHealthSnapshot } from "./runtime-health-snapshot";
import type { RuntimeStatus } from "./runtime-status";

export interface RuntimeDashboardProps {
  readonly statuses: readonly RuntimeStatus[];
  readonly health: RuntimeHealthSnapshot["health"] | null;
  readonly events?: readonly RuntimeHealthEvent[];
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly onRefresh?: () => void;
}

/**
 * Runtime process health dashboard (Phase 56).
 */
export function RuntimeDashboard({
  statuses,
  health,
  events = [],
  loading = false,
  error = null,
  onRefresh,
}: RuntimeDashboardProps) {
  return (
    <section
      className="runtime-dashboard"
      aria-label="Runtime dashboard"
      aria-busy={loading || undefined}
      data-testid="runtime-dashboard"
    >
      <header className="runtime-dashboard__header">
        <div>
          <h2>Runtime</h2>
          <p className="runtime-dashboard__subtitle">
            Process manager health for Jarvis services
          </p>
        </div>
        {onRefresh ? (
          <button
            type="button"
            className="btn btn-secondary runtime-dashboard__refresh"
            onClick={onRefresh}
            disabled={loading}
            data-testid="runtime-dashboard-refresh"
          >
            Refresh
          </button>
        ) : null}
      </header>

      {loading && statuses.length === 0 ? (
        <p className="runtime-dashboard__loading" data-testid="runtime-dashboard-loading">
          <span className="spinner" aria-hidden />
          Loading runtime health…
        </p>
      ) : null}

      {error ? (
        <p className="runtime-dashboard__error" role="alert" data-testid="runtime-dashboard-error">
          {error}
        </p>
      ) : null}

      {health ? (
        <div
          className={`runtime-dashboard__aggregate runtime-dashboard__aggregate--${health.status}`}
          data-testid="runtime-dashboard-aggregate"
          data-status={health.status}
        >
          <span className="runtime-dashboard__aggregate-label">Overall</span>
          <strong>{aggregateStatusLabel(health.status)}</strong>
          <span className="runtime-dashboard__aggregate-meta">
            {health.runningCount}/{health.processCount} running
            {health.failedCount > 0 ? ` · ${health.failedCount} failed` : ""}
          </span>
        </div>
      ) : null}

      <div className="runtime-dashboard__grid" data-testid="runtime-dashboard-grid">
        {statuses.map((status) => (
          <RuntimeHealthCard key={status.processId} status={status} />
        ))}
      </div>

      {events.length > 0 ? (
        <ul className="runtime-dashboard__events" data-testid="runtime-dashboard-events">
          {events.slice(-6).map((event) => (
            <li key={event.id} data-kind={event.kind}>
              {event.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
