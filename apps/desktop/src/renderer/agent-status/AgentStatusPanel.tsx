import type { AgentStatusEvent } from "./agent-status-event";
import { AgentStatusBadge } from "./AgentStatusBadge";
import type { AgentStatus } from "./agent-status";

export interface AgentStatusPanelProps {
  readonly status: AgentStatus;
  readonly events?: readonly AgentStatusEvent[];
  readonly loading?: boolean;
}

/**
 * Live Hermes/OpenClaw thinking and execution status panel (Phase 49).
 */
export function AgentStatusPanel({
  status,
  events = [],
  loading = false,
}: AgentStatusPanelProps) {
  const showThinking =
    loading || status.isActive || status.hermes !== "idle" || status.openClaw !== "idle";

  return (
    <section
      className="agent-status-panel"
      aria-label="Agent status"
      aria-busy={loading || undefined}
      data-testid="agent-status-panel"
    >
      <h2>Agents</h2>

      {showThinking ? (
        <p className="agent-status-thinking" data-testid="agent-status-thinking">
          {loading ? <span className="spinner" aria-hidden /> : null}
          <span>{status.displayMessage}</span>
        </p>
      ) : (
        <p className="agent-status-idle" data-testid="agent-status-idle">
          Agents are idle. Send a message to start.
        </p>
      )}

      <div className="agent-status-badges">
        <AgentStatusBadge agent="hermes" state={status.hermes} />
        <AgentStatusBadge agent="openclaw" state={status.openClaw} />
      </div>

      {status.memoryUpdating ? (
        <p className="agent-status-memory" data-testid="agent-status-memory">
          Memory updating…
        </p>
      ) : null}

      {status.error ? (
        <p className="agent-status-error" role="alert" data-testid="agent-status-error">
          {status.error}
        </p>
      ) : null}

      {events.length > 0 ? (
        <ul className="agent-status-events" data-testid="agent-status-events">
          {events.slice(-4).map((event) => (
            <li key={event.id}>{event.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
