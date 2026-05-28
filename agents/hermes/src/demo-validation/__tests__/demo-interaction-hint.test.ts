import { describe, expect, it } from "vitest";
import { DEMO_SCENARIO_COMMANDS } from "@jarvis/types";

import { evaluateHermesDemoInteraction } from "../demo-interaction-hint";

describe("evaluateHermesDemoInteraction", () => {
  it("detects demo browser scenarios", () => {
    const hint = evaluateHermesDemoInteraction(DEMO_SCENARIO_COMMANDS[3]);
    expect(hint.isDemoScenario).toBe(true);
    expect(hint.prefersBrowserWorkflow).toBe(true);
  });

  it("detects memory demo scenario", () => {
    const hint = evaluateHermesDemoInteraction(DEMO_SCENARIO_COMMANDS[4]);
    expect(hint.prefersMemoryCapture).toBe(true);
  });
});
