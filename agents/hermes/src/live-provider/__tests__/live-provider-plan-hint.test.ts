import { describe, expect, it } from "vitest";

import { REAL_PROVIDER_VALIDATION_COMMANDS } from "@jarvis/types";

import {
  isHermesLiveProviderPrompt,
  listHermesLiveProviderPlanHints,
  resolveHermesLiveProviderPlanHint,
} from "../live-provider-plan-hint";

describe("Hermes live provider plan hints", () => {
  it("resolves bitcoin trend prompt", () => {
    const hint = resolveHermesLiveProviderPlanHint("Explain Bitcoin trend today");

    expect(hint?.searchIntent).toBe(true);
    expect(hint?.summaryIntent).toBe(true);
  });

  it("lists all real provider validation hints", () => {
    expect(listHermesLiveProviderPlanHints()).toHaveLength(
      REAL_PROVIDER_VALIDATION_COMMANDS.length,
    );
  });

  it.each(REAL_PROVIDER_VALIDATION_COMMANDS)(
    "recognizes real provider prompt: %s",
    (prompt) => {
      expect(isHermesLiveProviderPrompt(prompt)).toBe(true);
      expect(resolveHermesLiveProviderPlanHint(prompt)?.goal).toBe(prompt);
    },
  );
});
