import type { SpeechRuntimeProviderId } from "../runtime";
import type { SpeechCapabilityMatch } from "./speech-capability-match";

const CAPABILITIES_BY_PROVIDER: Readonly<
  Record<SpeechRuntimeProviderId, readonly SpeechCapabilityMatch["capabilities"]>
> = {
  "stt-local": ["low-latency", "offline", "roman-urdu", "streaming-ready"],
  "stt-cloud": ["multilingual", "high-quality", "streaming-ready"],
  "tts-local": ["low-latency", "offline", "streaming-ready"],
  "tts-cloud": ["multilingual", "high-quality", "streaming-ready"],
};

/**
 * Deterministic capability resolver backed by static metadata (Phase 30).
 */
export class SpeechCapabilityResolver {
  resolve(providerId: SpeechRuntimeProviderId): SpeechCapabilityMatch {
    const capabilities = CAPABILITIES_BY_PROVIDER[providerId];
    return {
      providerId,
      capabilities: [...capabilities],
    };
  }

  resolveMany(
    providerIds: readonly SpeechRuntimeProviderId[],
  ): readonly SpeechCapabilityMatch[] {
    return providerIds.map((providerId) => this.resolve(providerId));
  }
}
