import { memo } from "react";

export interface MemoryContextIndicatorProps {
  readonly visible: boolean;
  readonly message?: string;
  readonly snippetCount?: number;
}

/**
 * Subtle memory activity indicator — user-facing only (Phase 93).
 */
export const MemoryContextIndicator = memo(function MemoryContextIndicator({
  visible,
  message = "Remembered context",
  snippetCount,
}: MemoryContextIndicatorProps) {
  if (!visible) {
    return null;
  }

  return (
    <p
      className="memory-context-indicator"
      data-testid="memory-context-indicator"
      role="status"
    >
      <span className="memory-context-indicator__dot" aria-hidden />
      {message}
      {snippetCount !== undefined && snippetCount > 0
        ? ` · ${snippetCount} item${snippetCount === 1 ? "" : "s"}`
        : null}
    </p>
  );
});
