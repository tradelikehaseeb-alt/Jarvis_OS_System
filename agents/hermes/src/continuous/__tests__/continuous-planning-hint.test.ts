import { describe, expect, it } from "vitest";

import { evaluateHermesContinuousPlanning } from "../continuous-planning-hint";

describe("evaluateHermesContinuousPlanning", () => {
  it("detects background monitoring workflow", () => {
    const hint = evaluateHermesContinuousPlanning("monitor gold market changes and alert me");
    expect(hint.continuous).toBe(true);
    expect(hint.background).toBe(true);
  });
});
