import { describe, expect, it } from "vitest";

import {
  DefaultSpeechContractValidator,
  createDefaultSpeechContractValidator,
} from "../contracts";

describe("speech contracts", () => {
  it("returns supported contract versions", () => {
    const validator = createDefaultSpeechContractValidator();
    expect(validator.getSupportedVersions()).toEqual(["1.0"]);
  });

  it("validates known stub provider contract", () => {
    const validator = new DefaultSpeechContractValidator();
    const result = validator.validateProvider({
      providerId: "stt-local",
      version: "1.0",
      capabilities: {
        supported: ["low-latency", "offline", "roman-urdu", "streaming-ready"],
        required: ["low-latency"],
      },
      runtimeRequirements: ["local-runtime"],
      stub: true,
    });

    expect(result.compatible).toBe(true);
    expect(result.providerId).toBe("stt-local");
    expect(result.stub).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("rejects provider contract with unsupported version", () => {
    const validator = createDefaultSpeechContractValidator();
    const result = validator.validateProvider({
      providerId: "tts-cloud",
      version: "1.0",
      capabilities: {
        supported: ["high-quality"],
        required: ["high-quality"],
      },
      runtimeRequirements: ["network-runtime"],
      stub: false,
    });

    expect(result.compatible).toBe(false);
    expect(result.reasons).toContain("Only stub providers are supported in this phase");
  });

  it("validates compatibility for stt-local low-latency request", () => {
    const validator = createDefaultSpeechContractValidator();
    const result = validator.validateCompatibility({
      providerId: "stt-local",
      version: "1.0",
      requiredCapabilities: ["low-latency"],
    });

    expect(result.compatible).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("reports missing capabilities in compatibility matrix", () => {
    const validator = createDefaultSpeechContractValidator();
    const result = validator.validateCompatibility({
      providerId: "tts-local",
      version: "1.0",
      requiredCapabilities: ["high-quality"],
    });

    expect(result.compatible).toBe(false);
    expect(result.reasons.some((reason) => reason.includes("high-quality"))).toBe(
      true,
    );
  });

  it("rejects version mismatch during compatibility validation", () => {
    const validator = createDefaultSpeechContractValidator();
    const result = validator.validateCompatibility({
      providerId: "stt-cloud",
      version: "1.0",
      requiredCapabilities: ["multilingual"],
    });

    expect(result.compatible).toBe(true);

    const mismatch = validator.validateCompatibility({
      providerId: "stt-cloud",
      version: "1.0",
      requiredCapabilities: ["roman-urdu"],
    });
    expect(mismatch.compatible).toBe(false);
    expect(
      mismatch.reasons.some((reason) => reason.includes("roman-urdu")),
    ).toBe(true);
  });
});
