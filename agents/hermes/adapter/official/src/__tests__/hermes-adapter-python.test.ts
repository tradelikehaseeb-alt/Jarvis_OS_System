import { describe, expect, it, vi, afterEach } from "vitest";

import { HermesAdapterPython } from "../hermes-adapter-python";
import type { HermesRequest } from "../../../src/hermes-request";

const sampleRequest: HermesRequest = {
  requestId: "req-py-1",
  taskId: "task-py-1",
  userId: "user-1",
  intent: { kind: "research", description: "Summarize Jarvis OS architecture" },
  contextRef: "ctx-1",
};

describe("HermesAdapterPython", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns failure when agent root is missing", async () => {
    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "",
    });

    const response = await adapter.invoke(sampleRequest);
    expect(response.success).toBe(false);
    expect(response.stub).toBe(false);
    expect(response.error?.code).toBe("HERMES_AGENT_PATH_MISSING");
  });

  it("returns failure when Groq key is missing", async () => {
    const adapter = new HermesAdapterPython({
      env: {},
      agentRoot: "C:\\hermes-agent",
    });

    const response = await adapter.invoke(sampleRequest);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("GROQ_API_KEY_MISSING");
  });

  it("maps parsed FINAL RESPONSE into a real plan", async () => {
    const runner = await import("../hermes-python-process-runner");
    vi.spyOn(runner, "runHermesAgentProcess").mockResolvedValue({
      success: true,
      finalResponse: "1. Analyze repo\n2. Draft plan",
      stdout: "FINAL RESPONSE:\n1. Analyze repo\n2. Draft plan",
      stderr: "",
      exitCode: 0,
    });

    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "C:\\hermes-agent",
    });

    const response = await adapter.invoke(sampleRequest);
    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(response.plan.steps.length).toBeGreaterThan(0);
    expect(response.reasoning.confidence).toBeGreaterThan(0.8);
  });
});
