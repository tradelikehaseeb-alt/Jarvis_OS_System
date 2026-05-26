import { describe, expect, it } from "vitest";

import { LanguageDetector } from "../language-detector";

describe("LanguageDetector", () => {
  const detector = new LanguageDetector();

  it("detects English-only transcripts", () => {
    const result = detector.detect("open my gold chart for analysis");
    expect(result.primary).toBe("en");
    expect(result.tokenCount).toBeGreaterThan(0);
  });

  it("detects Roman Urdu markers", () => {
    const result = detector.detect("mera laptop kholo");
    expect(result.primary).toBe("ur-roman");
    expect(result.romanUrduRatio).toBeGreaterThan(0);
  });

  it("detects mixed Roman Urdu and English", () => {
    const result = detector.detect("mera forex analysis kholo please");
    expect(result.primary).toBe("mixed");
  });
});
