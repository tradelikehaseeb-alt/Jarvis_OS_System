import { describe, expect, it } from "vitest";

import { evaluateHermesWorkforceCoordination } from "../workforce-coordination-hint";

describe("evaluateHermesWorkforceCoordination", () => {
  it("detects multi-agent trading brief workflow", () => {
    const hint = evaluateHermesWorkforceCoordination(
      "research AI news, summarize market impact, and prepare a trading brief",
    );
    expect(hint.multiAgent).toBe(true);
    expect(hint.workerCount).toBeGreaterThanOrEqual(2);
  });
});
