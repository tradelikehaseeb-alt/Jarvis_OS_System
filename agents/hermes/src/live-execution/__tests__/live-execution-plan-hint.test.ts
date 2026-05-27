import { describe, expect, it } from "vitest";

import {
  LIVE_EXECUTION_VALIDATION_COMMANDS,
  REAL_PROVIDER_VALIDATION_COMMANDS,
} from "@jarvis/types";

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

  it("resolves real provider gold price question", () => {
    const hint = resolveHermesLiveExecutionPlanHint("What is the gold price today?");

    expect(hint?.searchIntent).toBe(true);
    expect(hint?.summaryIntent).toBe(false);
  });

  it("resolves real provider AI news summary", () => {
    const hint = resolveHermesLiveExecutionPlanHint("Summarize latest AI news");

    expect(hint?.summaryIntent).toBe(true);
  });

  it("lists all validation command hints", () => {
    expect(listHermesLiveExecutionPlanHints()).toHaveLength(
      LIVE_EXECUTION_VALIDATION_COMMANDS.length +
        REAL_PROVIDER_VALIDATION_COMMANDS.length,
    );
  });
});
