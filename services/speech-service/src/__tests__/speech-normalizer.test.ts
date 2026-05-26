import { describe, expect, it } from "vitest";

import { SpeechNormalizer, normalizeTranscript } from "../speech-normalizer";

describe("SpeechNormalizer", () => {
  const normalizer = new SpeechNormalizer();

  it("normalizes for eggs analysis → forex analysis (trading domain)", () => {
    const result = normalizer.normalize("for eggs analysis", { domain: "trading" });
    expect(result.normalized).toBe("forex analysis");
    expect(result.appliedCorrections).toContain("stt-for-eggs-analysis");
  });

  it("normalizes Roman Urdu chart command", () => {
    const result = normalizer.normalize("mera gold ka chart kholo");
    expect(result.normalized).toBe("open my gold chart");
    expect(["ur-roman", "mixed"]).toContain(result.language.primary);
  });

  it("is deterministic", () => {
    const a = normalizeTranscript("mera gold ka chart kholo");
    const b = normalizeTranscript("mera gold ka chart kholo");
    expect(a).toEqual(b);
  });

  it("returns original text in result", () => {
    const input = "  for eggs analysis  ";
    const result = normalizer.normalize(input, { domain: "trading" });
    expect(result.original).toBe(input);
    expect(result.normalized).toBe("forex analysis");
  });
});
