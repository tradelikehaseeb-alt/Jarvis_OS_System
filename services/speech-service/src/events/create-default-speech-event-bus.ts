import { InMemorySpeechEventBus } from "./in-memory-speech-event-bus";
import type { SpeechEventBus } from "./speech-event-bus";

/**
 * Default speech event bus factory (Phase 32).
 */
export function createDefaultSpeechEventBus(): SpeechEventBus {
  return new InMemorySpeechEventBus();
}
