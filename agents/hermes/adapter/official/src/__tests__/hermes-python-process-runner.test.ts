import { describe, expect, it } from "vitest";

import { parseFinalResponseFromStdout } from "../hermes-python-process-runner";

describe("parseFinalResponseFromStdout", () => {
  it("extracts text after FINAL RESPONSE banner", () => {
    const stdout = [
      "Conversation summary",
      "🎯 FINAL RESPONSE:",
      "------------------------------",
      "Hello from Hermes agent.",
      "",
      "👋 Agent execution completed!",
    ].join("\n");

    expect(parseFinalResponseFromStdout(stdout)).toBe("Hello from Hermes agent.");
  });

  it("returns empty string when marker missing", () => {
    expect(parseFinalResponseFromStdout("no final section")).toBe("");
  });
});
