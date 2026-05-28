import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";
import { createOrchestratorVoiceSessionRuntime } from "../create-orchestrator-voice-session-runtime";

describe("orchestrator voice session integration", () => {
  it("feeds voice transcript through orchestrator execution chain", async () => {
    const orchestrator = await createTestOrchestratorService();
    const runtime = createOrchestratorVoiceSessionRuntime({ orchestrator });

    await runtime.feedTranscript("Plan my week");

    expect(runtime.getState()).toBe("idle");
    expect(runtime.getStreamingResponse().length).toBeGreaterThan(0);
  });
});
