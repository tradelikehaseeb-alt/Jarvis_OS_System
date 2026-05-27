import { describe, expect, it } from "vitest";

import {
  createTestLiveExecutionRuntime,
  LIVE_EXECUTION_VALIDATION_COMMANDS,
} from "../index";
import { DEFAULT_API_USER_ID } from "../../task-execution";
import { GROQ_PROVIDER_ID } from "../../llm-provider";

describe("live execution integration", () => {
  it("runs all validation commands with provider settings", async () => {
    const runtime = await createTestLiveExecutionRuntime();
    const session = runtime.startLiveExecution({
      userId: DEFAULT_API_USER_ID,
      providerId: GROQ_PROVIDER_ID,
    });

    for (const command of LIVE_EXECUTION_VALIDATION_COMMANDS) {
      const commandSession = runtime.startLiveExecution({
        userId: DEFAULT_API_USER_ID,
        providerId: GROQ_PROVIDER_ID,
      });

      const result = await runtime.executeLiveTask({
        sessionId: commandSession.sessionId,
        command,
      });

      expect(result.success).toBe(true);
      expect(result.session.providerId).toBe(GROQ_PROVIDER_ID);
      expect(result.flowResult.steps.some((s) => s.step === "hermes_planning")).toBe(
        true,
      );
      expect(
        result.flowResult.steps.some((s) => s.step === "openclaw_execution"),
      ).toBe(true);
    }
  });
});
