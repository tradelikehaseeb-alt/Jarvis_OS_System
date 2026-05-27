import type { TimelineEvent } from "./timeline-event";

/**
 * Timeline subscriber for live execution progress (Phase 75).
 */
export interface TimelineSubscriber {
  readonly subscriberId: string;
  onEvent(event: TimelineEvent): void;
}

export interface StartTimelineInput {
  readonly timelineId: string;
  readonly streamSessionId: string;
  readonly taskId: string;
}

/**
 * Execution timeline runtime contract (Phase 75).
 */
export interface TimelineRuntime {
  startTimeline(input: StartTimelineInput): void;
  appendTimelineEvent(event: TimelineEvent): void;
  completeTimeline(
    timelineId: string,
    success: boolean,
    message?: string,
  ): void;
  subscribeTimeline(subscriber: TimelineSubscriber): () => void;
  getEvents(timelineId: string): readonly TimelineEvent[];
}
