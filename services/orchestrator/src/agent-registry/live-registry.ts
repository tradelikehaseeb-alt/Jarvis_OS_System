import type { AgentRegistryContract, BaseAgent } from "@jarvis/agents-shared";

import type { AgentRegistry, RegisteredAgent } from "./contract";

/**
 * Maps {@link BaseAgent} metadata to orchestrator {@link RegisteredAgent} rows.
 */
export function agentToRegistered(agent: BaseAgent): RegisteredAgent {
  return {
    agentId: agent.metadata.agentId,
    displayName: agent.metadata.displayName,
    capabilities: agent.metadata.capabilities.map((c) => c.kind),
    executionCapable: agent.metadata.executionCapable,
  };
}

/**
 * Agent registry backed by live agents from {@link AgentRegistryContract} (Phase 14).
 * Metadata only at list/resolve — execution uses the same underlying registry.
 */
export class LiveAgentRegistry implements AgentRegistry {
  readonly componentId = "agent-registry" as const;

  constructor(private readonly agents: AgentRegistryContract) {}

  async list(): Promise<readonly RegisteredAgent[]> {
    const agents = await this.agents.list();
    return agents.map(agentToRegistered);
  }

  async resolve(agentId: string): Promise<RegisteredAgent | undefined> {
    const agent = await this.agents.resolve(agentId);
    return agent ? agentToRegistered(agent) : undefined;
  }
}
