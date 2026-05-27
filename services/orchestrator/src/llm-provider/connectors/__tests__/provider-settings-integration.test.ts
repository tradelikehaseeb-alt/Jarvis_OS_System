import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../../index";
import { DEFAULT_API_USER_ID } from "../../../task-execution";
import {
  createTestProviderSettingsRuntime,
  GROQ_PROVIDER_ID,
} from "../index";

describe("provider settings integration", () => {
  it("orchestrator uses selected provider from settings runtime", async () => {
    const providerSettingsRuntime = createTestProviderSettingsRuntime();
    providerSettingsRuntime.selectProvider(DEFAULT_API_USER_ID, GROQ_PROVIDER_ID);
    providerSettingsRuntime.selectModel(
      DEFAULT_API_USER_ID,
      GROQ_PROVIDER_ID,
      "llama-3.3-70b-versatile",
    );

    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask(
      {
        intent: { kind: "automate", description: "Provider settings run" },
        userId: DEFAULT_API_USER_ID,
      },
      { providerSettingsRuntime },
    );

    const llmProvider = record.taskStatus.output?.llmProvider as {
      providerId?: string;
      stub?: boolean;
    };

    expect(llmProvider?.providerId).toBe(GROQ_PROVIDER_ID);
    expect(llmProvider?.stub).toBe(true);
  });
});
