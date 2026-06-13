import { describe, expect, it, vi } from "vitest";

import {
  createDefaultOpenClawAgentCluster,
  createOpenClawAgentClusterMessaging,
} from "../agent-cluster";
import type {
  OpenClawSubAgent,
  OpenClawSubAgentInvocation,
  OpenClawSubAgentRunContext,
} from "../agent-cluster-types";
import type { AgentResult } from "@jarvis/agents-shared";

const baseInvocation = (
  profileId: OpenClawSubAgentInvocation["profileId"],
  suffix: string,
): OpenClawSubAgentInvocation => ({
  profileId,
  taskId: `task-${suffix}`,
  requestId: `req-${suffix}`,
  userId: "user-1",
  contextRef: "ctx-1",
});

describe("OpenClawAgentCluster", () => {
  it("registers the three foundational sub-agent profiles", () => {
    const cluster = createDefaultOpenClawAgentCluster();
    expect(cluster.listProfiles().sort()).toEqual([
      "BrowserScraperAgent",
      "EcomAutomationAgent",
      "SystemMonitorAgent",
    ]);
  });

  it("runs BrowserScraperAgent and streams scrape samples to Hermes", async () => {
    const cluster = createDefaultOpenClawAgentCluster();
    const messages: string[] = [];
    cluster.subscribe((message) => {
      if (message.kind === "stream" && message.target === "hermes") {
        messages.push(String(message.payload.stream));
      }
    });

    const instanceId = cluster.spawn({
      ...baseInvocation("BrowserScraperAgent", "scrape"),
      parameters: {
        url: "https://example.com",
        maxSamples: 2,
        intervalMs: 1,
      },
    });
    const result = await cluster.run(instanceId);

    expect(result.success).toBe(true);
    expect(result.isolated).toBe(true);
    expect(messages).toContain("browser_scrape");
    expect(cluster.getState(instanceId)?.status).toBe("completed");
  });

  it("runs EcomAutomationAgent with storefront session tracking", async () => {
    const cluster = createDefaultOpenClawAgentCluster();
    const result = await cluster.run(
      cluster.spawn({
        ...baseInvocation("EcomAutomationAgent", "ecom"),
        parameters: { storeId: "brand-alpha" },
      }),
    );

    expect(result.success).toBe(true);
    expect(result.payload?.storeId).toBe("brand-alpha");
    expect(result.payload?.sessionTracking).toBeDefined();
  });

  it("runs SystemMonitorAgent with process and storage snapshot", async () => {
    const cluster = createDefaultOpenClawAgentCluster();
    const result = await cluster.run(
      cluster.spawn({
        ...baseInvocation("SystemMonitorAgent", "monitor"),
        parameters: { watchProcesses: true, watchStorage: true },
      }),
    );

    expect(result.success).toBe(true);
    const snapshot = result.payload?.snapshot as Record<string, unknown>;
    expect(snapshot.processSignals).toBeDefined();
    expect(snapshot.storage).toBeDefined();
  });

  it("isolates failures during concurrent execution", async () => {
    class FailingAgent implements OpenClawSubAgent {
      readonly profileId = "BrowserScraperAgent" as const;
      readonly displayName = "Failing Scraper";
      readonly description = "Always fails for isolation test";

      run(_context: OpenClawSubAgentRunContext): Promise<AgentResult> {
        throw new Error("scraper crashed");
      }
    }

    const isolatedCluster = createDefaultOpenClawAgentCluster();
    isolatedCluster.registerProfile(new FailingAgent());

    const results = await isolatedCluster.runConcurrent([
      {
        ...baseInvocation("BrowserScraperAgent", "fail"),
        parameters: { url: "https://fail.test", maxSamples: 1, intervalMs: 1 },
      },
      {
        ...baseInvocation("SystemMonitorAgent", "ok"),
        parameters: { watchStorage: true },
      },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]?.success).toBe(false);
    expect(results[0]?.isolated).toBe(true);
    expect(results[1]?.success).toBe(true);
  });

  it("exposes orchestrator messaging with Hermes forwarding", async () => {
    const cluster = createDefaultOpenClawAgentCluster();
    const messaging = createOpenClawAgentClusterMessaging(cluster);
    const hermesSink = vi.fn();

    messaging.createMessageStream((message) => {
      messaging.forwardToHermes(message, hermesSink);
    });

    const results = await messaging.invokeConcurrent([
      {
        ...baseInvocation("EcomAutomationAgent", "stream"),
        parameters: { storeId: "demo-shop" },
      },
    ]);

    expect(results[0]?.success).toBe(true);
    expect(hermesSink).toHaveBeenCalled();
    const forwarded = hermesSink.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(forwarded.openclawCluster).toBeDefined();
  });
});
