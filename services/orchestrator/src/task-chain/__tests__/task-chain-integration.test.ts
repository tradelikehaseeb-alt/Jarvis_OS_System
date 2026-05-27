import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";

describe("task chain integration", () => {
  it("automate handshake includes task chain output from Hermes plan", async () => {
    const service = await createTestOrchestratorService();

    const { record } = await service.executeCreateTask({
      intent: { kind: "automate", description: "Export weekly report" },
    });

    const taskChain = record.taskStatus.output?.taskChain as {
      chainId?: string;
      stepCount?: number;
      events?: readonly { kind: string }[];
      stub?: boolean;
    };

    expect(taskChain?.chainId).toBeDefined();
    expect(taskChain?.stepCount ?? 0).toBeGreaterThan(0);
    expect(
      taskChain?.events?.some((event) => event.kind === "chain_completed"),
    ).toBe(true);
    expect(taskChain?.stub).toBe(true);

    const executionTimeline = record.taskStatus.output?.executionTimeline as {
      events?: readonly { kind: string }[];
    };
    expect(executionTimeline.events?.length ?? 0).toBeGreaterThan(0);
  });
});
