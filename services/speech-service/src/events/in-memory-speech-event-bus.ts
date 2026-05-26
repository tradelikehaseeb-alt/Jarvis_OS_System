import type { SpeechEvent } from "./speech-event";
import type { SpeechEventBus } from "./speech-event-bus";
import type { SpeechEventListener } from "./speech-event-listener";

/**
 * Deterministic in-memory speech event bus (Phase 32).
 */
export class InMemorySpeechEventBus implements SpeechEventBus {
  private readonly listeners = new Set<SpeechEventListener>();

  subscribe(listener: SpeechEventListener): () => void {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: SpeechEventListener): void {
    this.listeners.delete(listener);
  }

  emit(event: SpeechEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
