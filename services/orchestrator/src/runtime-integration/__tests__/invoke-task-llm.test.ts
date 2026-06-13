import { describe, expect, it, vi } from "vitest";

import type { ProviderSettingsRuntime } from "../../llm-provider/connectors/create-default-provider-settings-runtime";
import { invokeTaskLlm } from "../invoke-task-llm";

function mockRuntime(
  overrides: Partial<ProviderSettingsRuntime> = {},
): ProviderSettingsRuntime {
  return {
    saveApiKey: vi.fn(),
    validateApiKey: vi.fn().mockResolvedValue({
      valid: true,
      stub: false,
      providerId: "groq",
      message: "ok",
    }),
    selectProvider: vi.fn(),
    selectModel: vi.fn(),
    getProviderStatus: vi.fn(),
    listProviderStatuses: vi.fn(),
    getSettings: vi.fn(),
    resolveProviderId: vi.fn().mockReturnValue("groq"),
    resolveModel: vi.fn().mockReturnValue("llama-3.3-70b-versatile"),
    resolveApiKeyForExecution: vi.fn().mockReturnValue("test-key"),
    executePrompt: vi.fn().mockResolvedValue({
      success: true,
      providerId: "groq",
      kind: "groq",
      stub: false,
      model: "llama-3.3-70b-versatile",
      content: "Hello from Groq",
      streamed: false,
    }),
    streamResponse: vi.fn(),
    ...overrides,
  } as ProviderSettingsRuntime;
}

describe("invokeTaskLlm", () => {
  it("invokes conversational LLM when Hermes planning mode owns planning", async () => {
    vi.stubEnv("HERMES_MODE", "planning");
    const result = await invokeTaskLlm({
      task: {
        id: "task-1",
        userId: "user-1",
        intent: { kind: "research", description: "hello" },
        createdAt: new Date().toISOString(),
      },
      requestId: "req-1",
      providerSettingsRuntime: mockRuntime(),
    });

    expect(result.planningSource).toBe("hermes-adapter");
    expect(result.response).toBeDefined();
    expect(result.response?.content).toBe("Hello from Groq");
    vi.unstubAllEnvs();
  });

  it("skips duplicate Groq call for conversational chat intents", async () => {
    vi.stubEnv("HERMES_MODE", "local");
    const executePrompt = vi.fn();
    const result = await invokeTaskLlm({
      task: {
        id: "task-chat",
        userId: "user-1",
        intent: { kind: "default", description: "hello" },
        createdAt: new Date().toISOString(),
      },
      requestId: "req-chat",
      providerSettingsRuntime: mockRuntime({ executePrompt }),
    });

    expect(result.planningSource).toBe("hermes-adapter");
    expect(result.response).toBeUndefined();
    expect(executePrompt).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("does not replace automation execution with a generic chat reply", async () => {
    vi.stubEnv("HERMES_MODE", "local");
    const executePrompt = vi.fn();
    const result = await invokeTaskLlm({
      task: {
        id: "task-execute",
        userId: "user-1",
        intent: { kind: "automate", description: "Is video ko edit karo" },
        createdAt: new Date().toISOString(),
      },
      requestId: "req-execute",
      providerSettingsRuntime: mockRuntime({ executePrompt }),
    });

    expect(result.planningSource).toBe("hermes-adapter");
    expect(result.response).toBeUndefined();
    expect(executePrompt).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("uses orchestrator planning prompt when HERMES_MODE is stub", async () => {
    vi.stubEnv("HERMES_MODE", "stub");
    const executePrompt = vi.fn().mockResolvedValue({
      success: true,
      providerId: "llm-stub",
      kind: "stub",
      stub: true,
      model: "stub-model",
      content: "stub plan",
      streamed: false,
    });
    const runtime = mockRuntime({ executePrompt });

    const result = await invokeTaskLlm({
      task: {
        id: "task-2",
        userId: "user-1",
        intent: { kind: "automate", description: "Export dashboard" },
        createdAt: new Date().toISOString(),
      },
      requestId: "req-2",
      providerSettingsRuntime: runtime,
    });

    expect(result.planningSource).toBe("orchestrator-llm");
    expect(executePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("planning layer"),
      }),
    );
    vi.unstubAllEnvs();
  });
});
