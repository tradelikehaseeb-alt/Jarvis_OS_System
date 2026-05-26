import type {
  AgentMetadata,
  AgentRegistryContract,
  BaseAgent,
} from "@jarvis/agents-shared";
import { assertValidAgentInstance, assertValidAgentMetadata } from "@jarvis/agents-shared";

import type { AgentRegistry, RegisteredAgent } from "./contract";

/**
 * Maps {@link BaseAgent} metadata to orchestrator {@link RegisteredAgent} rows.
 */
export function agentToRegistered(agent: BaseAgent): RegisteredAgent {
  const metadata = assertValidAgentInstance(agent, "agentToRegistered");

  return {
    agentId: metadata.agentId,
    displayName: metadata.displayName,
    capabilities: metadata.capabilities.map((c) => c.kind),
    executionCapable: metadata.executionCapable,
  };
}

function metadataToRegistered(metadata: AgentMetadata): RegisteredAgent {
  assertValidAgentMetadata(metadata, "metadataToRegistered");
  return {
    agentId: metadata.agentId,
    displayName: metadata.displayName,
    capabilities: metadata.capabilities.map((c) => c.kind),
    executionCapable: metadata.executionCapable,
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
    return agents.map(metadataToRegistered);
  }

  async resolve(agentId: string): Promise<RegisteredAgent | undefined> {
    const agent = await this.agents.resolve(agentId);
    return agent ? agentToRegistered(agent) : undefined;
  }
}
