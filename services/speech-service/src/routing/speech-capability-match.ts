import type { SpeechRuntimeProviderId } from "../runtime";
import type { SpeechCapability } from "./speech-capability";

/**
 * Metadata row describing provider capabilities for routing decisions (Phase 30).
 */
export interface SpeechCapabilityMatch {
  readonly providerId: SpeechRuntimeProviderId;
  readonly capabilities: readonly SpeechCapability[];
}
