import type { SpeechCapability } from "./speech-capability";
import type { SpeechCapabilityMatch } from "./speech-capability-match";
import type { SpeechRoutingDecision } from "./speech-routing-decision";
import type { SpeechSelectionContext, SpeechSelectionPolicy } from "./speech-selection-policy";

function intersectCount(
  available: readonly SpeechCapability[],
  requested: readonly SpeechCapability[],
): number {
  const requestedSet = new Set(requested);
  return available.reduce(
    (count, capability) => (requestedSet.has(capability) ? count + 1 : count),
    0,
  );
}

/**
 * Deterministic metadata-only provider selection policy (Phase 30).
 */
export class DefaultSpeechSelectionPolicy implements SpeechSelectionPolicy {
  select(
    candidates: readonly SpeechCapabilityMatch[],
    context: SpeechSelectionContext,
  ): SpeechRoutingDecision {
    if (candidates.length === 0) {
      throw new Error("No speech routing candidates registered");
    }

    const requested = context.requestedCapabilities.filter(
      (capability): capability is SpeechCapability =>
        capability === "low-latency" ||
        capability === "offline" ||
        capability === "multilingual" ||
        capability === "roman-urdu" ||
        capability === "high-quality" ||
        capability === "streaming-ready",
    );

    const needsLowLatency =
      requested.includes("low-latency") || requested.includes("offline");
    const needsRomanUrdu = requested.includes("roman-urdu");
    const needsHighQuality = requested.includes("high-quality");

    const sorted = [...candidates].sort((a, b) => {
      const aScore = intersectCount(a.capabilities, requested);
      const bScore = intersectCount(b.capabilities, requested);
      if (bScore !== aScore) {
        return bScore - aScore;
      }

      if (needsRomanUrdu) {
        const aRoman = a.capabilities.includes("roman-urdu");
        const bRoman = b.capabilities.includes("roman-urdu");
        if (aRoman !== bRoman) {
          return Number(bRoman) - Number(aRoman);
        }
      }

      if (needsHighQuality) {
        const aHighQuality = a.capabilities.includes("high-quality");
        const bHighQuality = b.capabilities.includes("high-quality");
        if (aHighQuality !== bHighQuality) {
          return Number(bHighQuality) - Number(aHighQuality);
        }
      }

      if (needsLowLatency) {
        const aLowLatency = a.capabilities.includes("low-latency");
        const bLowLatency = b.capabilities.includes("low-latency");
        if (aLowLatency !== bLowLatency) {
          return Number(bLowLatency) - Number(aLowLatency);
        }
      }

      return a.providerId.localeCompare(b.providerId);
    });

    const selected = sorted[0] ?? candidates[0];
    if (!selected) {
      throw new Error("Unable to select speech routing candidate");
    }

    const matchedCapabilities = selected.capabilities.filter((capability) =>
      requested.includes(capability),
    );

    return {
      providerId: selected.providerId,
      matchedCapabilities,
      reason: `selected ${selected.providerId} from metadata capabilities`,
    };
  }
}
