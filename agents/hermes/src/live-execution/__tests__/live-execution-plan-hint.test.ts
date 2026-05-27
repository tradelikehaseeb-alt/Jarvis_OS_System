import { describe, expect, it } from "vitest";

import {
  listHermesLiveExecutionPlanHints,
  resolveHermesLiveExecutionPlanHint,
} from "../live-execution-plan-hint";

describe("Hermes live execution plan hints", () => {
  it("resolves search hint for gold price command", () => {
    const hint = resolveHermesLiveExecutionPlanHint("Search gold price today");

    expect(hint?.searchIntent).toBe(true);
    expect(hint?.browserIntent).toBe(false);
  });

  it("resolves browser hint for Google command", () => {
    const hint = resolveHermesLiveExecutionPlanHint("Open Google and search AI news");

    expect(hint?.browserIntent).toBe(true);
    expect(hint?.searchIntent).toBe(true);
  });

  it("lists all validation command hints", () => {
    expect(listHermesLiveExecutionPlanHints()).toHaveLength(3);
  });
});
