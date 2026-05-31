import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../../index";
import {
  createDefaultProviderValidationRuntime,
  GROQ_PROVIDER_ID,
} from "../index";

describe("multi-provider connector integration", () => {
  it("orchestrator automate flow works with multi-provider runtime", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Multi-provider planning run" },
      metadata: { llmProviderId: GROQ_PROVIDER_ID },
    });

    const llmProvider = record.taskStatus.output?.llmProvider as {
      providerId?: string;
      stub?: boolean;
      success?: boolean;
    };

    expect(llmProvider?.providerId).toBe(GROQ_PROVIDER_ID);
    expect(llmProvider?.stub).toBe(true);
    expect(llmProvider?.success).toBe(false);
  });

  it("lists all connector providers from validation runtime", () => {
    const runtime = createDefaultProviderValidationRuntime();
    expect(runtime.listProviders().length).toBeGreaterThanOrEqual(8);
  });
});
