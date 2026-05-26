import type { SpeechRuntimeProviderId } from "../runtime";
import { DefaultSpeechSelectionPolicy } from "./default-speech-selection-policy";
import { SpeechCapabilityResolver } from "./speech-capability-resolver";
import type { SpeechCapability } from "./speech-capability";
import type { SpeechRoutingDecision } from "./speech-routing-decision";
import type { SpeechSelectionContext, SpeechSelectionPolicy } from "./speech-selection-policy";

export interface SpeechCapabilityRouteRequest {
  readonly providerIds: readonly SpeechRuntimeProviderId[];
  readonly requestedCapabilities: readonly SpeechCapability[];
}

/**
 * Routing facade that resolves provider capability metadata and selects provider (Phase 30).
 */
export class SpeechCapabilityRouter {
  constructor(
    private readonly resolver: SpeechCapabilityResolver,
    private readonly policy: SpeechSelectionPolicy,
  ) {}

  route(request: SpeechCapabilityRouteRequest): SpeechRoutingDecision {
    const candidates = this.resolver.resolveMany(request.providerIds);
    const context: SpeechSelectionContext = {
      requestedCapabilities: request.requestedCapabilities,
    };
    return this.policy.select(candidates, context);
  }
}

export function createDefaultSpeechCapabilityRouter(): SpeechCapabilityRouter {
  return new SpeechCapabilityRouter(
    new SpeechCapabilityResolver(),
    new DefaultSpeechSelectionPolicy(),
  );
}
