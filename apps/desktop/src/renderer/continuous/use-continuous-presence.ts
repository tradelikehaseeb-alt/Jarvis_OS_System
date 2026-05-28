import { useMemo } from "react";

import { mapContinuousFromTaskOutput } from "./map-continuous-from-task-output";
import type { ContinuousViewState } from "./continuous-types";

export interface UseContinuousPresenceOptions {
  readonly taskOutput?: Readonly<Record<string, unknown>>;
  readonly loading?: boolean;
}

export interface UseContinuousPresenceResult {
  readonly continuous?: ContinuousViewState;
  readonly showContinuous: boolean;
  readonly displayLabel?: string;
  readonly hasBackgroundTasks: boolean;
}

/**
 * Derives continuous Jarvis presence from task output (Phase 99).
 */
export function useContinuousPresence(
  options: UseContinuousPresenceOptions = {},
): UseContinuousPresenceResult {
  const continuous = useMemo(
    () => mapContinuousFromTaskOutput(options.taskOutput),
    [options.taskOutput],
  );

  const showContinuous = Boolean(
    continuous &&
      (options.loading ||
        continuous.activities.length > 0 ||
        continuous.notifications.length > 0 ||
        continuous.continuous ||
        Boolean(continuous.summary)),
  );

  const displayLabel = options.loading
    ? continuous?.activeLabel ?? continuous?.activities.at(-1)?.userLabel
    : continuous?.continuous
      ? "Running in background."
      : continuous?.summary;

  return {
    continuous,
    showContinuous,
    displayLabel,
    hasBackgroundTasks: Boolean(
      continuous?.backgroundTaskCount && continuous.backgroundTaskCount > 0,
    ),
  };
}
