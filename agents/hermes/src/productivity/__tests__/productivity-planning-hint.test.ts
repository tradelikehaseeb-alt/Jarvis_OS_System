import { describe, expect, it } from "vitest";

import { evaluateHermesProductivityPlanning } from "../productivity-planning-hint";

describe("evaluateHermesProductivityPlanning", () => {
  it("detects email prioritization workflow", () => {
    const hint = evaluateHermesProductivityPlanning(
      "summarize unread emails and prepare my priorities",
    );

    expect(hint.productivity).toBe(true);
    expect(hint.workflowCount).toBeGreaterThan(1);
  });
});
