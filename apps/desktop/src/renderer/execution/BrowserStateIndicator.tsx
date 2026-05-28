import { memo } from "react";

import type { BrowserStateView } from "./execution-runtime-types";

export interface BrowserStateIndicatorProps {
  readonly browserState?: BrowserStateView;
}

/**
 * Subtle active browser session indicator (Phase 95).
 */
export const BrowserStateIndicator = memo(function BrowserStateIndicator({
  browserState,
}: BrowserStateIndicatorProps) {
  if (!browserState?.active || !browserState.url) {
    return null;
  }

  const stepLabel =
    typeof browserState.stepIndex === "number" &&
    typeof browserState.totalSteps === "number"
      ? ` · step ${browserState.stepIndex}/${browserState.totalSteps}`
      : "";

  return (
    <div
      className="browser-state-indicator"
      data-testid="browser-state-indicator"
      aria-live="polite"
    >
      <span className="browser-state-indicator__dot" aria-hidden />
      <span className="browser-state-indicator__label">
        {browserState.stub ? "Simulated browser" : "Browser active"}
        {stepLabel}
      </span>
      <span className="browser-state-indicator__url">{browserState.url}</span>
    </div>
  );
});
