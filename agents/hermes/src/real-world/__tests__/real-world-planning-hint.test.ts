import { describe, expect, it } from "vitest";

import { evaluateHermesRealWorldPlanning } from "../real-world-planning-hint";

describe("evaluateHermesRealWorldPlanning", () => {
  it("detects browser real-world workflow", () => {
    const hint = evaluateHermesRealWorldPlanning("open YouTube and search AI news");
    expect(hint.realWorld).toBe(true);
    expect(hint.browserWorkflow).toBe(true);
  });
});
