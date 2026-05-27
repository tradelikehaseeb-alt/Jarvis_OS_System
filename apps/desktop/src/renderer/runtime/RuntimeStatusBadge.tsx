export interface RuntimeStatusBadgeProps {
  readonly label: string;
  readonly healthy: boolean;
  readonly state?: string;
  readonly testId?: string;
}

/**
 * Compact health badge for runtime components (Phase 74).
 */
export function RuntimeStatusBadge({
  label,
  healthy,
  state,
  testId,
}: RuntimeStatusBadgeProps) {
  const tone = healthy ? "healthy" : "unhealthy";

  return (
    <span
      className={`runtime-status-badge runtime-status-badge--${tone}`}
      data-testid={testId ?? "runtime-status-badge"}
      data-healthy={healthy ? "true" : "false"}
      data-state={state}
      aria-label={`${label}: ${healthy ? "healthy" : "unhealthy"}`}
    >
      {label}
    </span>
  );
}
