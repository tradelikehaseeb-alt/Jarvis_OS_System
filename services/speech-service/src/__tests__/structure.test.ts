import { describe, expect, it } from "vitest";

import { SPEECH_SERVICE_MODULE_IDS } from "../index";

describe("speech-service structure", () => {
  it("exports expected module ids", () => {
    expect(SPEECH_SERVICE_MODULE_IDS).toEqual([
      "speech-context",
      "language-detector",
      "transcript-correction",
      "normalization-rules",
      "speech-normalizer",
      "adapters",
      "runtime",
      "routing",
      "session",
      "events",
      "conversation",
      "actions",
    ]);
  });
});
