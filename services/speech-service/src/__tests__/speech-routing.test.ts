import { describe, expect, it } from "vitest";

import {
  DefaultSpeechSelectionPolicy,
  SpeechCapabilityResolver,
  createDefaultSpeechCapabilityRouter,
} from "../routing";

describe("speech routing", () => {
  it("routes roman-urdu requests to stt-local", () => {
    const router = createDefaultSpeechCapabilityRouter();
    const decision = router.route({
      providerIds: ["stt-local", "stt-cloud"],
      requestedCapabilities: ["roman-urdu"],
    });

    expect(decision.providerId).toBe("stt-local");
    expect(decision.matchedCapabilities).toContain("roman-urdu");
  });

  it("routes high-quality english requests to stt-cloud", () => {
    const router = createDefaultSpeechCapabilityRouter();
    const decision = router.route({
      providerIds: ["stt-local", "stt-cloud"],
      requestedCapabilities: ["high-quality", "multilingual"],
    });

    expect(decision.providerId).toBe("stt-cloud");
    expect(decision.matchedCapabilities).toEqual(
      expect.arrayContaining(["high-quality", "multilingual"]),
    );
  });

  it("prefers local provider for low-latency requests", () => {
    const router = createDefaultSpeechCapabilityRouter();
    const decision = router.route({
      providerIds: ["tts-cloud", "tts-local"],
      requestedCapabilities: ["low-latency"],
    });

    expect(decision.providerId).toBe("tts-local");
    expect(decision.matchedCapabilities).toContain("low-latency");
  });

  it("resolves deterministic capability metadata for providers", () => {
    const resolver = new SpeechCapabilityResolver();
    expect(resolver.resolve("stt-local")).toEqual({
      providerId: "stt-local",
      capabilities: ["low-latency", "offline", "roman-urdu", "streaming-ready"],
    });
  });

  it("throws when selection has no candidates", () => {
    const policy = new DefaultSpeechSelectionPolicy();
    expect(() =>
      policy.select([], {
        requestedCapabilities: ["roman-urdu"],
      }),
    ).toThrow("No speech routing candidates registered");
  });
});
