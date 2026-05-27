import { describe, expect, it } from "vitest";

import { REAL_USER_SESSION_PROMPTS } from "@jarvis/types";

import {
  isHermesUserSessionPrompt,
  listHermesUserSessionPlanHints,
  resolveHermesUserSessionPlanHint,
} from "../user-session-plan-hint";

describe("Hermes user session plan hints", () => {
  it("resolves Dubai travel planning prompt", () => {
    const hint = resolveHermesUserSessionPlanHint("Plan a Dubai travel itinerary");

    expect(hint?.browserIntent).toBe(true);
    expect(hint?.summaryIntent).toBe(true);
  });

  it("lists all user session hints", () => {
    expect(listHermesUserSessionPlanHints()).toHaveLength(
      REAL_USER_SESSION_PROMPTS.length,
    );
  });

  it.each(REAL_USER_SESSION_PROMPTS)(
    "recognizes user session prompt: %s",
    (prompt) => {
      expect(isHermesUserSessionPrompt(prompt)).toBe(true);
      expect(resolveHermesUserSessionPlanHint(prompt)?.goal).toBe(prompt);
    },
  );
});
