import type { SpeechRuntimeProviderId } from "../runtime";
import type { SpeechCapability } from "./speech-capability";

/**
 * Final routing decision for speech provider selection (Phase 30).
 */
export interface SpeechRoutingDecision {
  readonly providerId: SpeechRuntimeProviderId;
  readonly matchedCapabilities: readonly SpeechCapability[];
  readonly reason: string;
}
