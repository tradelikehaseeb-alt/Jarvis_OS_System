import type { AgentRegistry, RegisteredAgent } from "./contract";

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

/** Legacy static agent catalog — test-only. */
export class AgentRegistryStub implements AgentRegistry {
  readonly componentId = "agent-registry" as const;

  async list(): Promise<readonly RegisteredAgent[]> {
    return STUB_AGENTS;
  }

  async resolve(agentId: string): Promise<RegisteredAgent | undefined> {
    return STUB_AGENTS.find((agent) => agent.agentId === agentId);
  }
}
