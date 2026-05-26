import { InMemorySpeechSessionManager } from "./in-memory-speech-session-manager";
import type { SpeechSessionManager } from "./speech-session-manager";

/**
 * Default session manager factory for speech-service (Phase 31).
 */
export function createDefaultSpeechSessionManager(): SpeechSessionManager {
  return new InMemorySpeechSessionManager();
}
