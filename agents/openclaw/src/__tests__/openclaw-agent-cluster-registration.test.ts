import { describe, expect, it, vi } from "vitest";

import {
  InMemoryAgentRegistry,
  createDefaultSkillPipeline,
} from "@jarvis/agents-shared";

import {
  getOpenClawAgentCluster,
  getOpenClawAgentClusterMessaging,
  registerOpenClawAgent,
  registerOpenClawAgentCluster,
} from "../index";

describe("OpenClaw cluster registration", () => {
  it("registers cluster messaging when OpenClaw agent is registered", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const registry = new InMemoryAgentRegistry();
    await registerOpenClawAgent(registry, skillExecutor);

    const cluster = getOpenClawAgentCluster();
    expect(cluster.listProfiles()).toContain("BrowserScraperAgent");
    expect(getOpenClawAgentClusterMessaging().cluster).toBe(cluster);
  });

  it("wires optional orchestrator message sink on cluster registration", async () => {
    const onMessage = vi.fn();
    const messaging = await registerOpenClawAgentCluster({ onMessage });

    await messaging.invokeConcurrent([
      {
        profileId: "SystemMonitorAgent",
        taskId: "task-reg",
        requestId: "req-reg",
        userId: "user-1",
        contextRef: "ctx-reg",
        parameters: { watchProcesses: true },
      },
    ]);

    expect(onMessage).toHaveBeenCalled();
  });
});
