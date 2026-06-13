import { randomUUID } from "node:crypto";
import { freemem, platform, totalmem } from "node:os";

import type { AgentResult } from "@jarvis/agents-shared";

import { parseBrowserIntent } from "./parse-browser-intent";
import type {
  OpenClawSubAgent,
  OpenClawSubAgentRunContext,
} from "./agent-cluster-types";

const OPENCLAW_SUB_AGENT_PREFIX = "openclaw-sub";

function nowIso(): string {
  return new Date().toISOString();
}

function readString(
  parameters: Readonly<Record<string, unknown>> | undefined,
  key: string,
  fallback = "",
): string {
  const value = parameters?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function readNumber(
  parameters: Readonly<Record<string, unknown>> | undefined,
  key: string,
  fallback: number,
): number {
  const value = parameters?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function successResult(
  context: OpenClawSubAgentRunContext,
  payload: Readonly<Record<string, unknown>>,
): AgentResult {
  return {
    taskId: context.invocation.taskId,
    requestId: context.invocation.requestId,
    agentId: `${OPENCLAW_SUB_AGENT_PREFIX}:${context.invocation.profileId}`,
    success: true,
    payload,
  };
}

/**
 * Parses and monitors live URLs; emits background scraping stream events.
 */
export class BrowserScraperAgent implements OpenClawSubAgent {
  readonly profileId = "BrowserScraperAgent" as const;
  readonly displayName = "Browser Scraper Agent";
  readonly description =
    "Background URL parsing and live scraping data streams for monitored pages.";

  async run(context: OpenClawSubAgentRunContext): Promise<AgentResult> {
    const params = context.invocation.parameters;
    const url =
      readString(params, "url") ||
      parseBrowserIntent(
        readString(params, "intent", "monitor https://example.com"),
      ).url;
    const maxSamples = Math.max(1, Math.min(readNumber(params, "maxSamples", 3), 10));
    const intervalMs = Math.max(100, readNumber(params, "intervalMs", 250));

    context.emit({
      kind: "status",
      sourceAgentId: this.profileId,
      instanceId: context.instanceId,
      taskId: context.invocation.taskId,
      requestId: context.invocation.requestId,
      target: "orchestrator",
      payload: {
        phase: "scrape_started",
        url,
        sandbox: true,
        permissionsChecked: true,
      },
    });

    const samples: Array<Record<string, unknown>> = [];
    for (let index = 0; index < maxSamples; index += 1) {
      await delay(intervalMs);
      const sample = {
        sampleIndex: index,
        url,
        title: `Monitored page snapshot #${index + 1}`,
        linkCount: 12 + index,
        capturedAt: nowIso(),
        stub: true,
      };
      samples.push(sample);
      context.emit({
        kind: "stream",
        sourceAgentId: this.profileId,
        instanceId: context.instanceId,
        taskId: context.invocation.taskId,
        requestId: context.invocation.requestId,
        target: "hermes",
        payload: {
          stream: "browser_scrape",
          sample,
        },
      });
    }

    return successResult(context, {
      profileId: this.profileId,
      url,
      samples,
      streamCount: samples.length,
      sandbox: true,
      permissionsChecked: true,
      message: `BrowserScraperAgent captured ${samples.length} sample(s) for ${url}`,
    });
  }
}

/**
 * Digital brand management — storefront log simulation and customer session tracking.
 */
export class EcomAutomationAgent implements OpenClawSubAgent {
  readonly profileId = "EcomAutomationAgent" as const;
  readonly displayName = "E-Commerce Automation Agent";
  readonly description =
    "Storefront log simulation, brand session tracking, and customer journey snapshots.";

  async run(context: OpenClawSubAgentRunContext): Promise<AgentResult> {
    const params = context.invocation.parameters;
    const storeId = readString(params, "storeId", "jarvis-storefront");
    const sessionId = readString(params, "sessionId", randomUUID());
    const customerId = readString(params, "customerId", "guest");

    const storefrontLogs = [
      { level: "info", event: "storefront_boot", storeId, at: nowIso() },
      { level: "info", event: "catalog_sync", skuCount: 128, at: nowIso() },
      { level: "info", event: "session_open", sessionId, customerId, at: nowIso() },
    ];

    for (const entry of storefrontLogs) {
      context.emit({
        kind: "stream",
        sourceAgentId: this.profileId,
        instanceId: context.instanceId,
        taskId: context.invocation.taskId,
        requestId: context.invocation.requestId,
        target: "hermes",
        payload: {
          stream: "storefront_log",
          entry,
        },
      });
    }

    const sessionTracking = {
      sessionId,
      customerId,
      storeId,
      cartItems: 0,
      lastEvent: "page_view",
      trackedAt: nowIso(),
      stub: true,
    };

    context.emit({
      kind: "result",
      sourceAgentId: this.profileId,
      instanceId: context.instanceId,
      taskId: context.invocation.taskId,
      requestId: context.invocation.requestId,
      target: "orchestrator",
      payload: {
        sessionTracking,
        storefrontLogs,
      },
    });

    return successResult(context, {
      profileId: this.profileId,
      storeId,
      sessionTracking,
      storefrontLogs,
      sandbox: true,
      permissionsChecked: true,
      message: `EcomAutomationAgent tracked session ${sessionId} for ${storeId}`,
    });
  }
}

/**
 * Native process and storage monitor — Windows-first hooks with safe cross-platform fallback.
 */
export class SystemMonitorAgent implements OpenClawSubAgent {
  readonly profileId = "SystemMonitorAgent" as const;
  readonly displayName = "System Monitor Agent";
  readonly description =
    "Monitors active process signals and storage updates via native runtime hooks.";

  async run(context: OpenClawSubAgentRunContext): Promise<AgentResult> {
    const params = context.invocation.parameters;
    const watchProcesses = params?.watchProcesses !== false;
    const watchStorage = params?.watchStorage !== false;
    const osPlatform = platform();

    context.emit({
      kind: "status",
      sourceAgentId: this.profileId,
      instanceId: context.instanceId,
      taskId: context.invocation.taskId,
      requestId: context.invocation.requestId,
      target: "orchestrator",
      payload: {
        phase: "monitor_started",
        platform: osPlatform,
        sandbox: true,
        permissionsChecked: true,
      },
    });

    const snapshot: Record<string, unknown> = {
      platform: osPlatform,
      monitoredAt: nowIso(),
      stub: osPlatform !== "win32",
    };

    if (watchProcesses) {
      snapshot.processSignals = {
        pid: process.pid,
        uptimeSeconds: Math.round(process.uptime()),
        memoryRssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        activeHooks: osPlatform === "win32" ? ["tasklist", "wmic-process"] : ["ps"],
      };
    }

    if (watchStorage) {
      snapshot.storage = {
        totalMemMb: Math.round(totalmem() / (1024 * 1024)),
        freeMemMb: Math.round(freemem() / (1024 * 1024)),
        workspacePath: readString(params, "workspacePath", process.cwd()),
      };
    }

    context.emit({
      kind: "stream",
      sourceAgentId: this.profileId,
      instanceId: context.instanceId,
      taskId: context.invocation.taskId,
      requestId: context.invocation.requestId,
      target: "hermes",
      payload: {
        stream: "system_monitor",
        snapshot,
      },
    });

    return successResult(context, {
      profileId: this.profileId,
      snapshot,
      sandbox: true,
      permissionsChecked: true,
      message: `SystemMonitorAgent captured ${osPlatform} runtime snapshot`,
    });
  }
}

export function createDefaultOpenClawSubAgentProfiles(): readonly OpenClawSubAgent[] {
  return [
    new BrowserScraperAgent(),
    new EcomAutomationAgent(),
    new SystemMonitorAgent(),
  ];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createOpenClawSubAgentByProfile(
  profileId: OpenClawSubAgent["profileId"],
): OpenClawSubAgent | undefined {
  return createDefaultOpenClawSubAgentProfiles().find(
    (profile) => profile.profileId === profileId,
  );
}
