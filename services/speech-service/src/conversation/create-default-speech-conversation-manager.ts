import { InMemorySpeechConversationManager } from "./in-memory-speech-conversation-manager";
import type { SpeechConversationManager } from "./speech-conversation-manager";

/**
 * Default conversation manager factory for speech-service (Phase 33).
 */
export function createDefaultSpeechConversationManager(): SpeechConversationManager {
  return new InMemorySpeechConversationManager();
}
