import type { AgentRegistry, RegisteredAgent } from "./contract";

/** Static agent catalog for stub wiring — not live Hermes/OpenClaw. */
const STUB_AGENTS: readonly RegisteredAgent[] = [
  {
    agentId: "hermes",
    displayName: "Hermes (stub)",
    capabilities: [
      "planning",
      "reasoning",
      "memory-access",
      "task-decomposition",
    ],
    executionCapable: false,
  },
  {
    agentId: "openclaw-gateway",
    displayName: "OpenClaw Gateway (stub)",
    capabilities: [
      "execution",
      "browser-automation",
      "desktop-automation",
    ],
    executionCapable: true,
  },
] as const;

/**
 * In-memory agent registry stub — metadata only, Phase 4.
 */
export class AgentRegistryStub implements AgentRegistry {
  readonly componentId = "agent-registry" as const;

  /** Returns the static stub catalog. */
  async list(): Promise<readonly RegisteredAgent[]> {
    return STUB_AGENTS;
  }

  /** Resolves by id from the static catalog. */
  async resolve(agentId: string): Promise<RegisteredAgent | undefined> {
    return STUB_AGENTS.find((a) => a.agentId === agentId);
  }
}
