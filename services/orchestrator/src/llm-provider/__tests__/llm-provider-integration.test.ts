import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";
import { DEFAULT_STUB_LLM_PROVIDER_ID } from "../llm-provider";

describe("LLM provider integration", () => {
  it("includes llmProvider output on automate handshake", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Export analytics dashboard" },
    });

    const llmProvider = record.taskStatus.output?.llmProvider as {
      providerId?: string;
      stub?: boolean;
      success?: boolean;
      validated?: boolean;
      contentPreview?: string;
    };

    expect(llmProvider?.providerId).toBe(DEFAULT_STUB_LLM_PROVIDER_ID);
    expect(llmProvider?.stub).toBe(true);
    expect(llmProvider?.success).toBe(true);
    expect(llmProvider?.validated).toBe(true);
    expect(llmProvider?.contentPreview).toContain("Export analytics dashboard");

    const adaptiveExecution = record.taskStatus.output?.adaptiveExecution as {
      success?: boolean;
    };
    expect(adaptiveExecution?.success).toBe(true);
  });

  it("honors metadata llmProviderId selection", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Local model planning" },
      metadata: { llmProviderId: "ollama" },
    });

    const llmProvider = record.taskStatus.output?.llmProvider as {
      providerId?: string;
      stub?: boolean;
    };

    expect(llmProvider?.providerId).toBe("ollama");
    expect(llmProvider?.stub).toBe(true);
  });
});
