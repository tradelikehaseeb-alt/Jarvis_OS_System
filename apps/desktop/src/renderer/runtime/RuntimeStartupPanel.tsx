import type {
  RuntimeStartupEvent,
  RuntimeStartupState,
} from "./runtime-startup-types";

export interface RuntimeStartupPanelProps {
  readonly status: RuntimeStartupState | null;
  readonly events?: readonly RuntimeStartupEvent[];
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly onRecover?: () => void;
  readonly onRefresh?: () => void;
}

function phaseLabel(phase: RuntimeStartupState["phase"]): string {
  switch (phase) {
    case "ready":
      return "Ready";
    case "bootstrapping":
      return "Bootstrapping";
    case "validating":
      return "Validating";
    case "recovering":
      return "Recovering";
    case "degraded":
      return "Degraded";
    case "failed":
      return "Failed";
    default:
      return "Idle";
  }
}

/**
 * Runtime startup status panel (Phase 73).
 */
export function RuntimeStartupPanel({
  status,
  events = [],
  loading = false,
  error = null,
  onRecover,
  onRefresh,
}: RuntimeStartupPanelProps) {
  return (
    <section
      className="runtime-startup-panel"
      aria-label="Runtime startup"
      aria-busy={loading || undefined}
      data-testid="runtime-startup-panel"
    >
      <header className="runtime-startup-panel__header">
        <div>
          <h3>Startup</h3>
          <p className="runtime-startup-panel__subtitle">
            Bootstrap, health validation, and recovery
          </p>
        </div>
        {onRefresh ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={loading}
            data-testid="runtime-startup-refresh"
          >
            Refresh
          </button>
        ) : null}
      </header>

      {loading && !status ? (
        <p data-testid="runtime-startup-loading">Starting runtime…</p>
      ) : null}

      {error ? (
        <p className="runtime-startup-panel__error" role="alert">
          {error}
        </p>
      ) : null}

      {status ? (
        <div
          className={`runtime-startup-panel__status runtime-startup-panel__status--${status.phase}`}
          data-testid="runtime-startup-status"
          data-phase={status.phase}
        >
          <strong>{phaseLabel(status.phase)}</strong>
          <span>
            {status.healthyProcessCount}/{status.processCount} probes healthy
          </span>
          {status.message ? <span>{status.message}</span> : null}
        </div>
      ) : null}

      {!status?.ready && onRecover ? (
        <button
          type="button"
          className="btn btn-primary runtime-startup-panel__recover"
          onClick={onRecover}
          disabled={loading}
          data-testid="runtime-startup-recover"
        >
          Recover runtime
        </button>
      ) : null}

      {events.length > 0 ? (
        <ul className="runtime-startup-panel__events" data-testid="runtime-startup-events">
          {events.slice(-5).map((event) => (
            <li key={event.id} data-kind={event.kind}>
              {event.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
