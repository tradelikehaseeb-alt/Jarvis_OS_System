import { describe, expect, it } from "vitest";

import {
  JARVIS_EXECUTION_LABELS,
  loadingMessageForJarvisIntent,
} from "../execution-display-labels";

describe("execution-display-labels", () => {
  it("uses Jarvis-facing planning copy", () => {
    expect(loadingMessageForJarvisIntent("plan")).toBe(
      JARVIS_EXECUTION_LABELS.understandingActive,
    );
    expect(loadingMessageForJarvisIntent("automate")).toBe(
      JARVIS_EXECUTION_LABELS.performingActive,
    );
  });

  it("never exposes internal agent names in labels", () => {
    const blob = JSON.stringify(JARVIS_EXECUTION_LABELS);
    expect(blob.toLowerCase()).not.toContain("hermes");
    expect(blob.toLowerCase()).not.toContain("openclaw");
  });
});
