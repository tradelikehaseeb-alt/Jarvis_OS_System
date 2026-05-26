import type { SpeechEvent } from "./speech-event";
import type { SpeechEventListener } from "./speech-event-listener";

/**
 * In-memory event bus contract for speech orchestration (Phase 32).
 */
export interface SpeechEventBus {
  subscribe(listener: SpeechEventListener): () => void;
  unsubscribe(listener: SpeechEventListener): void;
  emit(event: SpeechEvent): void;
}
