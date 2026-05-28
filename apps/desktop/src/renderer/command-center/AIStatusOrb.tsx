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
}

/**
 * Central status orb — visual heartbeat of Jarvis activity (Phase 89).
 */
export function AIStatusOrb({
  state,
  label,
  providerLabel,
  latencyMs,
}: AIStatusOrbProps) {
  return (
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
      {providerLabel ? (
        <p className="ai-status-orb__provider" data-testid="ai-status-provider">
          {providerLabel}
          {typeof latencyMs === "number" ? ` · ${latencyMs}ms` : null}
        </p>
      ) : null}
    </div>
  );
}
