import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";
import { createOrchestratorVoiceExecutionRuntime } from "../create-orchestrator-voice-execution-runtime";

describe("Voice execution orchestrator integration", () => {
  it("runs voice input through speech, intent, and orchestrator pipeline", async () => {
    const service = await createTestOrchestratorService();
    const runtime = createOrchestratorVoiceExecutionRuntime({
      orchestrator: service,
    });

    const result = await runtime.processVoiceInput({
      requestId: "req-voice-int-1",
      rawInput: "Plan dashboard rollout",
    });

    expect(result.success).toBe(true);
    expect(result.taskId).toMatch(/^task-/);
    expect(result.classification?.intent).toBe("plan");

    const activityStream = result.activityStream as {
      events?: readonly { type: string }[];
    };
    expect(activityStream.events?.length ?? 0).toBeGreaterThan(0);
  });

  it("supports automate voice intents through handshake pipeline", async () => {
    const service = await createTestOrchestratorService();
    const runtime = createOrchestratorVoiceExecutionRuntime({
      orchestrator: service,
    });

    const result = await runtime.processVoiceInput({
      requestId: "req-voice-int-2",
      rawInput: "Automate opening the dashboard",
    });

    expect(result.success).toBe(true);
    expect(result.classification?.intent).toBe("automate");
  });
});
