import type { SpeechCapability } from "../routing";

/**
 * Capability metadata attached to a speech provider contract (Phase 40).
 */
export interface SpeechProviderCapabilities {
  readonly supported: readonly SpeechCapability[];
  readonly required: readonly SpeechCapability[];
}
