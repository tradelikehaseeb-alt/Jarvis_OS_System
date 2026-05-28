import { useMemo } from "react";

import { mapProductivityFromTaskOutput } from "./map-productivity-from-task-output";
import type { ProductivityViewState } from "./productivity-types";

export interface UseProductivitySessionOptions {
  readonly taskOutput?: Readonly<Record<string, unknown>>;
  readonly loading?: boolean;
}

export interface UseProductivitySessionResult {
  readonly productivity?: ProductivityViewState;
  readonly showProductivity: boolean;
  readonly displayLabel?: string;
}

/**
 * Derives daily productivity presentation from task output (Phase 98).
 */
export function useProductivitySession(
  options: UseProductivitySessionOptions = {},
): UseProductivitySessionResult {
  const productivity = useMemo(
    () => mapProductivityFromTaskOutput(options.taskOutput),
    [options.taskOutput],
  );

  const showProductivity = Boolean(
    productivity &&
      (options.loading ||
        productivity.activities.length > 0 ||
        productivity.suggestions.length > 0 ||
        Boolean(productivity.summary)),
  );

  const displayLabel = options.loading
    ? productivity?.activeLabel ?? productivity?.activities.at(-1)?.userLabel
    : productivity?.completed
      ? "Completed."
      : productivity?.summary;

  return {
    productivity,
    showProductivity,
    displayLabel,
  };
}
