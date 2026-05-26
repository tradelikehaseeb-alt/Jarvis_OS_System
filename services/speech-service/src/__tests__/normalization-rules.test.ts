import { describe, expect, it } from "vitest";

import { LanguageDetector } from "../language-detector";
import { applyNormalizationRules } from "../normalization-rules";

describe("applyNormalizationRules", () => {
  const detector = new LanguageDetector();

  it("maps Roman Urdu open-chart phrase to English", () => {
    const language = detector.detect("mera gold ka chart kholo");
    const result = applyNormalizationRules(
      "mera gold ka chart kholo",
      { domain: "general" },
      language,
    );
    expect(result.text).toBe("open my gold chart");
    expect(result.appliedRuleIds).toContain("ur-phrase-open-chart");
  });
});
