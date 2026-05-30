import { describe, expect, it } from "vitest";

import { isRealBrowserExecutionEnabled } from "../browser-real-mode";

describe("isRealBrowserExecutionEnabled", () => {
  it("returns true when JARVIS_BROWSER_REAL is true", () => {
    expect(isRealBrowserExecutionEnabled({ JARVIS_BROWSER_REAL: "true" })).toBe(true);
  });

  it("returns false by default", () => {
    expect(isRealBrowserExecutionEnabled({})).toBe(false);
  });
});
