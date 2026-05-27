import { attachExecutionStream } from "../streaming/attach-execution-stream";
import type { StreamEvent } from "../streaming/stream-event";
import type { StreamManager } from "../streaming/stream-manager";

import type { ActivityStreamEvent } from "./activity-stream-event";
import type {
  ActivityStreamRuntime,
  ActivityStreamSubscriber,
  StartActivityStreamInput,
} from "./activity-stream-runtime";
import { toActivityStreamEvent } from "./to-activity-stream-event";

export interface CreateDefaultActivityRuntimeOptions {
  readonly streamManager: StreamManager;
}

class DefaultActivityStreamRuntime implements ActivityStreamRuntime {
  private readonly eventsBySession = new Map<string, ActivityStreamEvent[]>();
  private readonly subscribers = new Map<string, ActivityStreamSubscriber>();
  private readonly detaches = new Map<string, () => void>();
  private readonly streamUnsubscribe: () => void;

  constructor(private readonly streamManager: StreamManager) {
    this.streamUnsubscribe = this.streamManager.subscribe({
      subscriberId: "activity-stream-runtime",
      onEvent: (event) => this.handleStreamEvent(event),
    });
  }

  startStream(input: StartActivityStreamInput): () => void {
    this.eventsBySession.set(input.streamSessionId, []);

    const detach = attachExecutionStream(
      this.streamManager,
      input.lifecycle,
      input,
    );
    this.detaches.set(input.streamSessionId, detach);

    return () => {
      detach();
      this.detaches.delete(input.streamSessionId);
    };
  }

  stopStream(streamSessionId: string): void {
    const detach = this.detaches.get(streamSessionId);
    if (detach) {
      detach();
      this.detaches.delete(streamSessionId);
    }
    this.streamManager.closeSession(streamSessionId);
  }

  subscribe(subscriber: ActivityStreamSubscriber): () => void {
    this.subscribers.set(subscriber.subscriberId, subscriber);
    return () => {
      this.unsubscribe(subscriber.subscriberId);
    };
  }

  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  getEvents(streamSessionId: string): readonly ActivityStreamEvent[] {
    return this.eventsBySession.get(streamSessionId) ?? [];
  }

  private handleStreamEvent(event: StreamEvent): void {
    const activityEvent = toActivityStreamEvent(event);
    const bucket = this.eventsBySession.get(event.streamSessionId);
    if (bucket) {
      bucket.push(activityEvent);
    }

    for (const subscriber of this.subscribers.values()) {
      subscriber.onEvent(activityEvent);
    }
  }

  /** @internal test teardown */
  dispose(): void {
    this.streamUnsubscribe();
    for (const detach of this.detaches.values()) {
      detach();
    }
    this.detaches.clear();
    this.subscribers.clear();
    this.eventsBySession.clear();
  }
}

/**
 * Factory for default live activity stream runtime (Phase 71).
 */
export function createDefaultActivityRuntime(
  options: CreateDefaultActivityRuntimeOptions,
): ActivityStreamRuntime {
  return new DefaultActivityStreamRuntime(options.streamManager);
}
