import { describe, expect, it } from "vitest";

import { evaluateOpenClawRealWorldExecution } from "../real-world-execution-check";

describe("evaluateOpenClawRealWorldExecution", () => {
  it("requires sandbox for browser real-world commands", () => {
    const check = evaluateOpenClawRealWorldExecution("open Gmail");
    expect(check.browserRequired).toBe(true);
    expect(check.sandbox).toBe(true);
  });
});
