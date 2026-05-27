import { useCallback, useMemo, useState } from "react";
import type { TaskStatusResponse } from "@jarvis/types";

import {
  useActivityStream,
  type ActivityEvent,
  type ActivityStreamSubscriber,
  type UseActivityStreamOptions,
} from "../activity";

import {
  computeTimelineProgress,
  mapActivityEventsToTimelineSteps,
  mapExecutionTimelineToSteps,
} from "./map-activity-to-timeline-steps";
import type { TimelineStep } from "./timeline-step";

export interface TimelineSubscriber {
  readonly subscriberId: string;
  onStep(step: TimelineStep): void;
}

export interface UseExecutionTimelineOptions extends UseActivityStreamOptions {}

export interface UseExecutionTimelineResult {
  readonly steps: readonly TimelineStep[];
  readonly events: readonly ActivityEvent[];
  readonly progress: number;
  readonly loading: boolean;
  readonly isStreaming: boolean;
  readonly startTimeline: (intentKind: string) => void;
  readonly stopTimeline: () => void;
  readonly subscribeTimeline: (subscriber: TimelineSubscriber) => () => void;
  readonly unsubscribeTimeline: (subscriberId: string) => void;
  readonly ingestTaskStatus: (status: TaskStatusResponse) => void;
  readonly reportError: (message: string) => void;
  readonly reset: () => void;
  /** Activity stream compatibility for voice execution and agent status. */
  readonly startStream: (intentKind: string) => void;
  readonly stopStream: () => void;
  readonly subscribe: (subscriber: ActivityStreamSubscriber) => () => void;
  readonly unsubscribe: (subscriberId: string) => void;
}

/**
 * Execution timeline hook — composes activity stream without duplicating events (Phase 75).
 */
export function useExecutionTimeline(
  options: UseExecutionTimelineOptions = {},
): UseExecutionTimelineResult {
  const activity = useActivityStream(options);
  const [resolvedSteps, setResolvedSteps] = useState<TimelineStep[]>([]);

  const simulatedSteps = useMemo(
    () => mapActivityEventsToTimelineSteps(activity.events),
    [activity.events],
  );

  const steps = resolvedSteps.length > 0 ? resolvedSteps : simulatedSteps;
  const progress = computeTimelineProgress(steps);

  const subscribeTimeline = useCallback(
    (subscriber: TimelineSubscriber) => {
      const bridge: ActivityStreamSubscriber = {
        subscriberId: subscriber.subscriberId,
        onEvent: (event) => {
          const [step] = mapActivityEventsToTimelineSteps([event]);
          if (step) {
            subscriber.onStep(step);
          }
        },
      };
      return activity.subscribe(bridge);
    },
    [activity],
  );

  const ingestTaskStatus = useCallback(
    (status: TaskStatusResponse) => {
      activity.ingestTaskStatus(status);

      const executionTimeline = status.output?.executionTimeline as
        | { events?: readonly Parameters<typeof mapExecutionTimelineToSteps>[0] }
        | undefined;

      if (executionTimeline?.events?.length) {
        setResolvedSteps(mapExecutionTimelineToSteps(executionTimeline.events));
        return;
      }

      setResolvedSteps([]);
    },
    [activity],
  );

  const reset = useCallback(() => {
    activity.reset();
    setResolvedSteps([]);
  }, [activity]);

  return {
    steps,
    events: activity.events,
    progress,
    loading: activity.loading,
    isStreaming: activity.isStreaming,
    startTimeline: activity.startStream,
    stopTimeline: activity.stopStream,
    subscribeTimeline,
    unsubscribeTimeline: activity.unsubscribe,
    ingestTaskStatus,
    reportError: activity.reportError,
    reset,
    startStream: activity.startStream,
    stopStream: activity.stopStream,
    subscribe: activity.subscribe,
    unsubscribe: activity.unsubscribe,
  };
}
