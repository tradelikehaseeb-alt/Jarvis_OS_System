import { describe, expect, it } from "vitest";

import { evaluateHermesSafeExecution } from "../safe-execution-fallback";

describe("evaluateHermesSafeExecution", () => {
  it("returns stub mode when runtime is invalid", () => {
    expect(evaluateHermesSafeExecution({ runtimeValid: false, stub: false }).mode).toBe(
      "stub",
    );
  });
});
