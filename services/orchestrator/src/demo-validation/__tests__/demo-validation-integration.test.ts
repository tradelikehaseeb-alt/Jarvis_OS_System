import { describe, expect, it } from "vitest";

import { createTestDemoValidationBundle } from "../create-default-demo-validation-runtime";
import { DEMO_SCENARIO_COMMANDS } from "@jarvis/types";

describe("demo validation integration", () => {
  it("runs demo scenarios through live execution harness", async () => {
    const bundle = await createTestDemoValidationBundle();
    const report = await bundle.demoScenarioRuntime.runAllScenarios();

    expect(report.scenarios.length).toBe(DEMO_SCENARIO_COMMANDS.length);
    expect(report.passed).toBeGreaterThan(0);
  }, 60_000);
});
