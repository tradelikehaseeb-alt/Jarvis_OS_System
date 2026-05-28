import { useMemo } from "react";

import { mapWorkforceFromTaskOutput } from "./map-workforce-from-task-output";
import type { WorkforceActivityViewState } from "./workforce-types";

export interface UseWorkforceActivityOptions {
  readonly taskOutput?: Readonly<Record<string, unknown>>;
  readonly loading?: boolean;
}

export interface UseWorkforceActivityResult {
  readonly workforce?: WorkforceActivityViewState;
  readonly showWorkforce: boolean;
  readonly displayLabel?: string;
}

/**
 * Derives multi-agent workforce presentation from task output (Phase 97).
 */
export function useWorkforceActivity(
  options: UseWorkforceActivityOptions = {},
): UseWorkforceActivityResult {
  const workforce = useMemo(
    () => mapWorkforceFromTaskOutput(options.taskOutput),
    [options.taskOutput],
  );

  const showWorkforce = Boolean(
    workforce &&
      (options.loading ||
        workforce.activities.length > 0 ||
        Boolean(workforce.summary)),
  );

  const displayLabel = options.loading
    ? workforce?.activeLabel ?? workforce?.activities.at(-1)?.userLabel
    : workforce?.completed
      ? "Completed."
      : workforce?.summary;

  return {
    workforce,
    showWorkforce,
    displayLabel,
  };
}
