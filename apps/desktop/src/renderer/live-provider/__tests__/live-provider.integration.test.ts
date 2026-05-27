import { describe, expect, it } from "vitest";

import { REAL_PROVIDER_VALIDATION_COMMANDS } from "@jarvis/types";

import { createTestLiveProviderRuntime } from "@jarvis/orchestrator";

describe("desktop live provider integration", () => {
  it("runs real provider validation scenarios through orchestrator runtime", async () => {
    const runtime = await createTestLiveProviderRuntime();
    const report = await runtime.runValidationScenarios({
      userId: "desktop-user",
    });

    expect(report.promptResults).toHaveLength(REAL_PROVIDER_VALIDATION_COMMANDS.length);

    for (const result of report.promptResults) {
      expect(result.success).toBe(true);
      expect(result.workspaceUpdated).toBe(true);
      expect(result.telemetryCaptured).toBe(true);
    }
  });
});
