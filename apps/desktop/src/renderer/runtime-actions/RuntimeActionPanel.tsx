import type { RuntimeStatus } from "../runtime/runtime-status";
import type { RuntimeAction } from "./runtime-action";
import type { UseRuntimeActionsResult } from "./use-runtime-actions";

export interface RuntimeActionPanelProps {
  readonly statuses: readonly RuntimeStatus[];
  readonly actions: Pick<
    UseRuntimeActionsResult,
    | "loading"
    | "activeAction"
    | "activeProcessId"
    | "error"
    | "startProcess"
    | "stopProcess"
    | "restartProcess"
    | "refreshHealth"
  >;
}

function isActionLoading(
  actions: RuntimeActionPanelProps["actions"],
  action: RuntimeAction,
  processId?: string,
): boolean {
  if (!actions.loading) {
    return false;
  }

  if (actions.activeAction !== action) {
    return false;
  }

  if (action === "refresh-health") {
    return actions.activeProcessId === null;
  }

  return actions.activeProcessId === processId;
}

/**
 * Runtime service control panel (Phase 57).
 */
export function RuntimeActionPanel({ statuses, actions }: RuntimeActionPanelProps) {
  return (
    <section
      className="runtime-action-panel"
      aria-label="Runtime actions"
      aria-busy={actions.loading || undefined}
      data-testid="runtime-action-panel"
    >
      <header className="runtime-action-panel__header">
        <h2>Controls</h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            void actions.refreshHealth();
          }}
          disabled={actions.loading}
          data-testid="runtime-action-refresh-health"
        >
          {isActionLoading(actions, "refresh-health") ? (
            <span className="spinner" aria-hidden />
          ) : null}
          Refresh health
        </button>
      </header>

      {actions.loading && statuses.length === 0 ? (
        <p className="runtime-action-panel__loading" data-testid="runtime-action-loading">
          <span className="spinner" aria-hidden />
          Running action…
        </p>
      ) : null}

      {actions.error ? (
        <p className="runtime-action-panel__error" role="alert" data-testid="runtime-action-error">
          {actions.error}
        </p>
      ) : null}

      <ul className="runtime-action-panel__list">
        {statuses.map((status) => (
          <li
            key={status.processId}
            className="runtime-action-panel__row"
            data-testid={`runtime-action-row-${status.processId}`}
          >
            <div className="runtime-action-panel__row-meta">
              <strong>{status.displayName}</strong>
              <span data-testid={`runtime-action-state-${status.processId}`}>
                {status.state}
              </span>
            </div>
            <div className="runtime-action-panel__buttons">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={actions.loading || status.state === "running"}
                onClick={() => {
                  void actions.startProcess(status.processId);
                }}
                data-testid={`runtime-action-start-${status.processId}`}
              >
                {isActionLoading(actions, "start", status.processId) ? (
                  <span className="spinner" aria-hidden />
                ) : null}
                Start
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={actions.loading || status.state === "stopped"}
                onClick={() => {
                  void actions.stopProcess(status.processId);
                }}
                data-testid={`runtime-action-stop-${status.processId}`}
              >
                {isActionLoading(actions, "stop", status.processId) ? (
                  <span className="spinner" aria-hidden />
                ) : null}
                Stop
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={actions.loading}
                onClick={() => {
                  void actions.restartProcess(status.processId);
                }}
                data-testid={`runtime-action-restart-${status.processId}`}
              >
                {isActionLoading(actions, "restart", status.processId) ? (
                  <span className="spinner" aria-hidden />
                ) : null}
                Restart
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
