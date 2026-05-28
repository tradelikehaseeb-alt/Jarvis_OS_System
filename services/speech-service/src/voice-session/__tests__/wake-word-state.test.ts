import { describe, expect, it } from "vitest";

import {
  DEFAULT_WAKE_WORD_CONFIG,
  detectWakeWord,
} from "../wake-word-state";

describe("detectWakeWord", () => {
  it("triggers when phrase prefix is spoken", () => {
    const result = detectWakeWord("Jarvis what is gold price", DEFAULT_WAKE_WORD_CONFIG);
    expect(result.matched).toBe(true);
    expect(result.state).toBe("triggered");
    expect(result.commandText).toBe("what is gold price");
  });

  it("arms when phrase is absent in wake-word mode", () => {
    const result = detectWakeWord("hello there", DEFAULT_WAKE_WORD_CONFIG, "armed");
    expect(result.matched).toBe(false);
    expect(result.state).toBe("armed");
  });

  it("bypasses gating when wake word disabled", () => {
    const result = detectWakeWord("check inbox", {
      phrase: "jarvis",
      enabled: false,
    });
    expect(result.matched).toBe(true);
    expect(result.commandText).toBe("check inbox");
  });
});
