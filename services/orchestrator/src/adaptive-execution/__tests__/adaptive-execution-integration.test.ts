import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";

describe("adaptive execution integration", () => {
  it("automate handshake includes adaptive execution output", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Adapt workflow steps" },
    });

    const adaptiveExecution = record.taskStatus.output?.adaptiveExecution as {
      executionId?: string;
      success?: boolean;
      stepCount?: number;
      events?: readonly { kind: string }[];
      stub?: boolean;
    };

    expect(adaptiveExecution?.executionId).toBeDefined();
    expect(adaptiveExecution?.success).toBe(true);
    expect(adaptiveExecution?.stub).toBe(true);
    expect(
      adaptiveExecution?.events?.some(
        (event) => event.kind === "execution_completed",
      ),
    ).toBe(true);

    const taskChain = record.taskStatus.output?.taskChain as {
      chainId?: string;
      success?: boolean;
      events?: readonly { kind: string }[];
    };

    expect(taskChain?.chainId).toBeDefined();
    expect(taskChain?.success).toBe(true);
    expect(
      taskChain?.events?.some((event) => event.kind === "chain_completed"),
    ).toBe(true);

    const executionTimeline = record.taskStatus.output?.executionTimeline as {
      events?: readonly { kind: string }[];
    };
    expect(executionTimeline.events?.length ?? 0).toBeGreaterThan(0);
  });
});
