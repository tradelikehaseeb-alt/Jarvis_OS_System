import { describe, expect, it } from "vitest";

import { stabilizePartialTranscript, naturalWordDelayMs } from "../transcript-stabilizer";

describe("stabilizePartialTranscript", () => {
  it("preserves growing prefix", () => {
    expect(stabilizePartialTranscript("Jarvis", "Jarvis open")).toBe("Jarvis open");
  });

  it("keeps longer stable text when incoming shrinks", () => {
    expect(stabilizePartialTranscript("Jarvis open calendar", "Jarvis open")).toBe(
      "Jarvis open calendar",
    );
  });

  it("shares word prefix across corrections", () => {
    expect(stabilizePartialTranscript("Jarvis opn", "Jarvis open")).toBe("Jarvis open");
  });
});

describe("naturalWordDelayMs", () => {
  it("adds pause for punctuation", () => {
    expect(naturalWordDelayMs("done.")).toBeGreaterThan(naturalWordDelayMs("done"));
  });
});
