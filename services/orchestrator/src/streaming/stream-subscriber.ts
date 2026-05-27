import type { StreamEvent } from "./stream-event";

/**
 * Stream event consumer (Phase 47).
 */
export interface StreamSubscriber {
  readonly subscriberId: string;
  onEvent(event: StreamEvent): void;
}
