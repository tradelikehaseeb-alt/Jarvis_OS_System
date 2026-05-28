import { describe, expect, it } from "vitest";

import { evaluateOpenClawSafeExecution } from "../safe-execution-fallback";

describe("evaluateOpenClawSafeExecution", () => {
  it("returns degraded mode for stub runtime", () => {
    expect(evaluateOpenClawSafeExecution({ runtimeValid: true, stub: true }).mode).toBe(
      "degraded",
    );
  });
});
