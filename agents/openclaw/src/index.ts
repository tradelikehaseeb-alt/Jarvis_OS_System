/**
 * @jarvis/openclaw — OpenClaw gateway + adapter + skills (Phase 16).
 */

import type { AgentRegistryContract, SkillExecutor } from "@jarvis/agents-shared";

import type { OpenClawAdapter } from "../adapter/src/openclaw-adapter";
import { createOpenClawAdapterStub } from "../adapter/src/openclaw-adapter-stub";
import { OpenClawAgent } from "./openclaw-agent";
import {
  createDefaultOpenClawAgentCluster,
  createOpenClawAgentClusterMessaging,
  type OpenClawAgentCluster,
  type OpenClawAgentClusterMessaging,
} from "./execution-runtime/agent-cluster";
import type { OpenClawClusterMessageListener } from "./execution-runtime/agent-cluster-types";

export { OpenClawAgent } from "./openclaw-agent";
export { OPENCLAW_AGENT_ID, OPENCLAW_METADATA } from "./metadata";
export * from "../adapter/src";
export * from "./gateway";
export * from "./runtime";
export * from "./browser-runtime";
export * from "./live-execution";
export * from "./live-provider";
export * from "./user-session";
export * from "./hardening";
export * from "./execution-runtime";
export * from "./workforce";
export * from "./productivity";
export * from "./continuous";
export * from "./real-world";

let defaultOpenClawAgentCluster: OpenClawAgentCluster | null = null;
let defaultOpenClawAgentClusterMessaging: OpenClawAgentClusterMessaging | null =
  null;

/** Shared OpenClaw multi-agent cluster singleton for orchestrator integration. */
export function getOpenClawAgentCluster(): OpenClawAgentCluster {
  if (!defaultOpenClawAgentCluster) {
    defaultOpenClawAgentCluster = createDefaultOpenClawAgentCluster();
  }
  return defaultOpenClawAgentCluster;
}

/** Messaging surface for concurrent sub-agent invocation and Hermes stream forwarding. */
export function getOpenClawAgentClusterMessaging(): OpenClawAgentClusterMessaging {
  if (!defaultOpenClawAgentClusterMessaging) {
    defaultOpenClawAgentClusterMessaging = createOpenClawAgentClusterMessaging(
      getOpenClawAgentCluster(),
    );
  }
  return defaultOpenClawAgentClusterMessaging;
}

/**
 * Register the OpenClaw agent cluster with optional orchestrator/Hermes message sinks.
 * Returns the messaging interface used by the core Orchestrator service.
 */
export async function registerOpenClawAgentCluster(options?: {
  readonly onMessage?: OpenClawClusterMessageListener;
  readonly cluster?: OpenClawAgentCluster;
}): Promise<OpenClawAgentClusterMessaging> {
  const cluster = options?.cluster ?? getOpenClawAgentCluster();
  const messaging = createOpenClawAgentClusterMessaging(cluster);
  defaultOpenClawAgentCluster = cluster;
  defaultOpenClawAgentClusterMessaging = messaging;

  if (options?.onMessage) {
    messaging.createMessageStream(options.onMessage);
  }

  return messaging;
}

/** Create OpenClaw with {@link SkillExecutor} and optional {@link OpenClawAdapter}. */
export function createOpenClawAgent(
  skillExecutor: SkillExecutor,
  adapter: OpenClawAdapter = createOpenClawAdapterStub(),
): OpenClawAgent {
  return new OpenClawAgent(skillExecutor, adapter);
}

export async function registerOpenClawAgent(
  registry: AgentRegistryContract,
  skillExecutor: SkillExecutor,
  adapter: OpenClawAdapter = createOpenClawAdapterStub(),
): Promise<OpenClawAgent> {
  const agent = createOpenClawAgent(skillExecutor, adapter);
  await registry.register(agent);
  await registerOpenClawAgentCluster();
  return agent;
}
