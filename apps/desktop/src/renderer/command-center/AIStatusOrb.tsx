export type AIStatusOrbState =
  | "idle"
  | "thinking"
  | "streaming"
  | "executing"
  | "complete"
  | "error";

export interface AIStatusOrbProps {
  readonly state: AIStatusOrbState;
  readonly label?: string;
  readonly providerLabel?: string;
  readonly latencyMs?: number;
  readonly confidence?: number;
}

/**
 * Central status orb — visual heartbeat of Jarvis activity (Phase 89).
 */
export function AIStatusOrb({
  state,
  label,
  providerLabel,
  latencyMs,
  confidence,
}: AIStatusOrbProps) {
  const showMetrics =
    typeof confidence === "number" ||
    typeof latencyMs === "number" ||
    Boolean(providerLabel);

  return (
    <div className="cc-orb-stack" data-testid="ai-status-orb-stack">
      <div
        className={`ai-status-orb ai-status-orb--${state}`}
        data-testid="ai-status-orb"
        data-state={state}
        role="status"
        aria-live="polite"
      >
        <div className="ai-status-orb__core" aria-hidden />
        <div className="ai-status-orb__ring" aria-hidden />
        {label ? <p className="ai-status-orb__label">{label}</p> : null}
      </div>

      {showMetrics ? (
        <div className="cc-orb-micro-dashboard cc-glass" data-testid="ai-status-micro-dashboard">
          {providerLabel ? (
            <span className="cc-orb-micro-dashboard__item" data-testid="ai-status-provider">
              {providerLabel}
            </span>
          ) : null}
          {typeof confidence === "number" ? (
            <span className="cc-orb-micro-dashboard__item">
              {Math.round(confidence * 100)}% conf
            </span>
          ) : null}
          {typeof latencyMs === "number" ? (
            <span className="cc-orb-micro-dashboard__item">
              {Math.round(latencyMs)} ms
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
