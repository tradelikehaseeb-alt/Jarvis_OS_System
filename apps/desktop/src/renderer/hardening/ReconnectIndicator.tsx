import { memo } from "react";

export interface ReconnectIndicatorProps {
  readonly visible: boolean;
  readonly message?: string;
  readonly degraded?: boolean;
}

/**
 * Subtle reconnect / degraded-mode indicator (Phase 94).
 */
export const ReconnectIndicator = memo(function ReconnectIndicator({
  visible,
  message = "Reconnecting…",
  degraded = false,
}: ReconnectIndicatorProps) {
  if (!visible) {
    return null;
  }

  return (
    <p
      className={`reconnect-indicator${degraded ? " reconnect-indicator--degraded" : ""}`}
      data-testid="reconnect-indicator"
      role="status"
    >
      <span className="reconnect-indicator__dot" aria-hidden />
      {message}
    </p>
  );
});
