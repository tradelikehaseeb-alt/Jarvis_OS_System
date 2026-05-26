import { describe, expect, it } from "vitest";

import { TranscriptCorrection } from "../transcript-correction";

describe("TranscriptCorrection", () => {
  const correction = new TranscriptCorrection();

  it("corrects for eggs analysis when domain is trading", () => {
    const result = correction.correct("for eggs analysis", { domain: "trading" });
    expect(result.text).toBe("forex analysis");
    expect(result.appliedCorrectionIds).toContain("stt-for-eggs-analysis");
  });

  it("skips trading corrections in general domain", () => {
    const result = correction.correct("for eggs analysis", { domain: "general" });
    expect(result.text).toBe("for eggs analysis");
    expect(result.appliedCorrectionIds).toHaveLength(0);
  });
});
