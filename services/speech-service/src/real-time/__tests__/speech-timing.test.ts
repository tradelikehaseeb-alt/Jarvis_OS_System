import { describe, expect, it } from "vitest";

import { naturalWordDelayMs, stabilizePartialTranscript } from "../speech-timing";

describe("speech-timing", () => {
  it("stabilizes partial transcript prefixes", () => {
    expect(stabilizePartialTranscript("Jarvis", "Jarvis plan")).toBe("Jarvis plan");
  });

  it("uses shorter base delay for short words", () => {
    expect(naturalWordDelayMs("hi")).toBeLessThan(naturalWordDelayMs("calendar."));
  });
});
