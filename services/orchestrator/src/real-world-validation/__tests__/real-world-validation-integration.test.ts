import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";
import { createRealWorldValidationRuntime } from "../real-world-validation-runtime";

describe("real world validation integration", () => {
  it("runs real-world validation commands through orchestrator", async () => {
    const service = await createTestOrchestratorService();
    const runtime = createRealWorldValidationRuntime(service);

    const report = await runtime.validate({
      commands: [
        "Jarvis, open YouTube and search AI news",
        "Jarvis, summarize latest gold market updates",
      ],
      conversationId: "conv-rw-int-100",
    });

    expect(report.commandValidations.length).toBe(2);
    expect(report.commandValidations.every((entry) => entry.success)).toBe(true);
    expect(report.longSession.stable).toBe(true);
  });
});
