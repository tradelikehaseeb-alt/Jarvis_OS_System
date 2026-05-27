import type { ActivityStreamRuntime } from "../activity/activity-stream-runtime";
import type { ActivityStreamEvent } from "../activity/activity-stream-event";

import { TIMELINE_EVENT_LABELS, type TimelineEvent } from "./timeline-event";
import type {
  StartTimelineInput,
  TimelineRuntime,
  TimelineSubscriber,
} from "./timeline-runtime";
import { toTimelineEvent } from "./to-timeline-event";

export interface CreateDefaultTimelineRuntimeOptions {
  readonly activityRuntime: ActivityStreamRuntime;
}

interface TimelineBucket {
  readonly streamSessionId: string;
  readonly taskId: string;
  completed: boolean;
  events: TimelineEvent[];
}

let manualEventCounter = 0;

function nextManualEventId(kind: string): string {
  manualEventCounter += 1;
  return `timeline-manual-${kind}-${manualEventCounter}`;
}

class DefaultTimelineRuntime implements TimelineRuntime {
  private readonly timelines = new Map<string, TimelineBucket>();
  private readonly subscribers = new Map<string, TimelineSubscriber>();
  private readonly activityUnsubscribe: () => void;

  constructor(options: CreateDefaultTimelineRuntimeOptions) {
    this.activityUnsubscribe = options.activityRuntime.subscribe({
      subscriberId: "timeline-runtime",
      onEvent: (event) => this.handleActivityEvent(event),
    });
  }

  startTimeline(input: StartTimelineInput): void {
    this.timelines.set(input.timelineId, {
      streamSessionId: input.streamSessionId,
      taskId: input.taskId,
      completed: false,
      events: [],
    });
  }

  appendTimelineEvent(event: TimelineEvent): void {
    const bucket = this.timelines.get(event.timelineId);
    if (!bucket || bucket.completed) {
      return;
    }

    if (!bucket.events.some((entry) => entry.id === event.id)) {
      bucket.events.push(event);
      this.notify(event);
    }
  }

  completeTimeline(
    timelineId: string,
    success: boolean,
    message?: string,
  ): void {
    const bucket = this.timelines.get(timelineId);
    if (!bucket) {
      return;
    }

    bucket.completed = true;
    const kind = success ? "completed" : "failed";
    const event: TimelineEvent = {
      id: nextManualEventId(kind),
      kind,
      label: TIMELINE_EVENT_LABELS[kind],
      message,
      timestamp: new Date().toISOString(),
      status: success ? "complete" : "error",
      timelineId,
      taskId: bucket.taskId,
    };

    bucket.events.push(event);
    this.notify(event);
  }

  subscribeTimeline(subscriber: TimelineSubscriber): () => void {
    this.subscribers.set(subscriber.subscriberId, subscriber);
    return () => {
      this.subscribers.delete(subscriber.subscriberId);
    };
  }

  getEvents(timelineId: string): readonly TimelineEvent[] {
    return this.timelines.get(timelineId)?.events ?? [];
  }

  /** @internal test teardown */
  dispose(): void {
    this.activityUnsubscribe();
    this.subscribers.clear();
    this.timelines.clear();
  }

  private handleActivityEvent(event: ActivityStreamEvent): void {
    for (const [timelineId, bucket] of this.timelines.entries()) {
      if (bucket.completed || bucket.streamSessionId !== event.streamSessionId) {
        continue;
      }

      const mapped = toTimelineEvent(event, timelineId);
      if (mapped) {
        this.appendTimelineEvent(mapped);
      }
    }
  }

  private notify(event: TimelineEvent): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.onEvent(event);
    }
  }
}

/**
 * Factory for timeline runtime backed by activity stream (Phase 75).
 */
export function createDefaultTimelineRuntime(
  options: CreateDefaultTimelineRuntimeOptions,
): TimelineRuntime {
  return new DefaultTimelineRuntime(options);
}
