import { describe, expect, it } from "vitest";

import {
  createTestLiveExecutionRuntime,
  LIVE_EXECUTION_VALIDATION_COMMANDS,
} from "../index";
import { DEFAULT_API_USER_ID } from "../../task-execution";

describe("live execution e2e", () => {
  it.each(LIVE_EXECUTION_VALIDATION_COMMANDS)(
    "executes live validation command: %s",
    async (command) => {
      const runtime = await createTestLiveExecutionRuntime();
      const session = runtime.startLiveExecution({
        userId: DEFAULT_API_USER_ID,
        conversationId: "conv-live-e2e",
      });

      const updates: string[] = [];
      runtime.streamLiveUpdates(session.sessionId, {
        subscriberId: "e2e-sub",
        onUpdate: (update) => updates.push(update.kind),
      });

      const result = await runtime.executeLiveTask({
        sessionId: session.sessionId,
        command,
      });

      const telemetry = runtime.captureTelemetry(session.sessionId);

      expect(result.success).toBe(true);
      expect(result.flowResult.record.createTaskResponse.status).toBe("completed");
      expect(result.flowResult.uiProjection.agentStatus.hermes).toBe("completed");
      expect(result.flowResult.uiProjection.agentStatus.openClaw).toBe("completed");
      expect(updates).toContain("planning");
      expect(updates).toContain("executing");
      expect(telemetry.streamEvents.length).toBeGreaterThan(0);
    },
  );
});
