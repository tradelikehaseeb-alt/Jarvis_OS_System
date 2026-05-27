import type { RuntimeStatus } from "./runtime-status";

export interface RuntimeHealthCardProps {
  readonly status: RuntimeStatus;
}

function stateLabel(state: RuntimeStatus["state"]): string {
  switch (state) {
    case "stopped":
      return "Stopped";
    case "starting":
      return "Starting";
    case "running":
      return "Running";
    case "restarting":
      return "Restarting";
    case "failed":
      return "Failed";
  }
}

/**
 * Card showing a single managed runtime process (Phase 56).
 */
export function RuntimeHealthCard({ status }: RuntimeHealthCardProps) {
  return (
    <article
      className={`runtime-health-card runtime-health-card--${status.state}`}
      data-testid={`runtime-health-card-${status.processId}`}
      data-state={status.state}
      data-healthy={status.healthy ? "true" : "false"}
    >
      <header className="runtime-health-card__header">
        <h3>{status.displayName}</h3>
        <span
          className={`runtime-health-card__badge runtime-health-card__badge--${status.state}`}
          data-testid={`runtime-health-badge-${status.processId}`}
        >
          {stateLabel(status.state)}
        </span>
      </header>

      <dl className="runtime-health-card__meta">
        <div>
          <dt>Health</dt>
          <dd data-testid={`runtime-health-value-${status.processId}`}>
            {status.healthy ? "Healthy" : "Unhealthy"}
          </dd>
        </div>
        <div>
          <dt>Restarts</dt>
          <dd data-testid={`runtime-restart-count-${status.processId}`}>
            {status.restartCount}
          </dd>
        </div>
      </dl>

      {status.lastError ? (
        <p
          className="runtime-health-card__error"
          role="alert"
          data-testid={`runtime-error-${status.processId}`}
        >
          {status.lastError}
        </p>
      ) : null}
    </article>
  );
}
