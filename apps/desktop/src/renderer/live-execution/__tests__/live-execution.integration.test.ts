import { describe, expect, it } from "vitest";

import {
  createTestLiveExecutionRuntime,
  LIVE_EXECUTION_VALIDATION_COMMANDS,
} from "@jarvis/orchestrator";

describe("desktop live execution integration", () => {
  it("runs validation commands through orchestrator runtime", async () => {
    const runtime = await createTestLiveExecutionRuntime();

    for (const command of LIVE_EXECUTION_VALIDATION_COMMANDS) {
      const session = runtime.startLiveExecution({
        userId: "desktop-user",
        conversationId: "conv-live-desktop",
      });

      const result = await runtime.executeLiveTask({
        sessionId: session.sessionId,
        command,
      });

      expect(result.success).toBe(true);
      expect(result.flowResult.uiProjection.agentStatus.displayMessage).toBeTruthy();
    }
  });
});
