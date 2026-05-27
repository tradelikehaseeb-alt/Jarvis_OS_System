import type { ActivityStreamEvent } from "./activity-stream-event";

/**
 * Activity stream subscriber (Phase 71).
 */
export interface ActivityStreamSubscriber {
  readonly subscriberId: string;
  onEvent(event: ActivityStreamEvent): void;
}

/**
 * Live activity stream runtime contract (Phase 71).
 */
export interface ActivityStreamRuntime {
  startStream(input: StartActivityStreamInput): () => void;
  stopStream(streamSessionId: string): void;
  subscribe(subscriber: ActivityStreamSubscriber): () => void;
  unsubscribe(subscriberId: string): void;
  getEvents(streamSessionId: string): readonly ActivityStreamEvent[];
}

export interface StartActivityStreamInput {
  readonly streamSessionId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly conversationId: string;
  readonly lifecycle: import("../execution/execution-lifecycle-manager").ExecutionLifecycleManager;
}
