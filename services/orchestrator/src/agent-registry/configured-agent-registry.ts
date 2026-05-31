import { readHermesRuntimeEnv } from "@jarvis/hermes";
import { readOpenClawRuntimeEnv } from "@jarvis/openclaw";

import { HERMES_AGENT_ID, OPENCLAW_AGENT_ID } from "../execution/agent-ids";
import type { AgentRegistry, RegisteredAgent } from "./contract";

function hermesDisplayName(mode: string): string {
  switch (mode) {
    case "local":
      return "Hermes (Python local)";
    case "official":
      return "Hermes (official)";
    case "planning":
      return "Hermes (planning)";
    default:
      return "Hermes";
  }
}

function openClawDisplayName(mode: string): string {
  switch (mode) {
    case "official":
    case "remote":
      return "OpenClaw (official gateway)";
    case "local":
      return "OpenClaw (local)";
    default:
      return "OpenClaw Gateway";
  }
}

function buildCatalog(
  env: Readonly<Record<string, string | undefined>>,
): readonly RegisteredAgent[] {
  const hermesMode = readHermesRuntimeEnv(env).mode;
  const openClawMode = readOpenClawRuntimeEnv(env).mode;

  return [
    {
      agentId: HERMES_AGENT_ID,
      displayName: hermesDisplayName(hermesMode),
      capabilities: [
        "planning",
        "reasoning",
        "memory-access",
        "task-decomposition",
      ],
      executionCapable: false,
    },
    {
      agentId: OPENCLAW_AGENT_ID,
      displayName: openClawDisplayName(openClawMode),
      capabilities: [
        "execution",
        "browser-automation",
        "desktop-automation",
      ],
      executionCapable: true,
    },
  ] as const;
}

/**
 * Environment-aware agent catalog (Hermes local + OpenClaw official when configured).
 */
export class ConfiguredAgentRegistry implements AgentRegistry {
  readonly componentId = "agent-registry" as const;

  constructor(
    private readonly env: Readonly<Record<string, string | undefined>> = process.env,
  ) {}

  async list(): Promise<readonly RegisteredAgent[]> {
    return buildCatalog(this.env);
  }

  async resolve(agentId: string): Promise<RegisteredAgent | undefined> {
    return buildCatalog(this.env).find((agent) => agent.agentId === agentId);
  }
}
