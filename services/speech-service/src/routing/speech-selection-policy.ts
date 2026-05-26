import type { SpeechCapabilityMatch } from "./speech-capability-match";
import type { SpeechRoutingDecision } from "./speech-routing-decision";

export interface SpeechSelectionContext {
  readonly requestedCapabilities: readonly string[];
  readonly preferCloudForQuality?: boolean;
}

/**
 * Strategy interface for deterministic speech provider selection (Phase 30).
 */
export interface SpeechSelectionPolicy {
  select(
    candidates: readonly SpeechCapabilityMatch[],
    context: SpeechSelectionContext,
  ): SpeechRoutingDecision;
}
