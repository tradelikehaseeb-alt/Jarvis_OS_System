import { InMemorySpeechRecoveryManager } from "./in-memory-speech-recovery-manager";
import type { SpeechRecoveryManager } from "./speech-recovery-manager";

/**
 * Default recovery manager factory for speech-service (Phase 39).
 */
export function createDefaultSpeechRecoveryManager(): SpeechRecoveryManager {
  return new InMemorySpeechRecoveryManager();
}
