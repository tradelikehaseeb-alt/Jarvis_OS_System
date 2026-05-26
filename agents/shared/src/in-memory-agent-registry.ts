import type { BaseAgent } from "./base-agent";
import type { AgentMetadata } from "./agent-metadata";
import type { AgentRegistryContract } from "./agent-registry-contract";
import { assertValidAgentInstance } from "./agent-metadata-validation";

/**
 * In-memory {@link AgentRegistryContract} for development and tests (Phase 10).
 * Not for production clustering — replace with persistent registry later.
 */
export class InMemoryAgentRegistry implements AgentRegistryContract {
  readonly contractId = "agent-registry" as const;

  private readonly agents = new Map<string, BaseAgent>();

  async register(agent: BaseAgent): Promise<void> {
    const metadata = assertValidAgentInstance(agent, "InMemoryAgentRegistry.register");
    this.agents.set(metadata.agentId, agent);
  }

  async unregister(agentId: string): Promise<boolean> {
    return this.agents.delete(agentId);
  }

  async resolve(agentId: string): Promise<BaseAgent | undefined> {
    return this.agents.get(agentId);
  }

  async list(): Promise<readonly AgentMetadata[]> {
    return [...this.agents.values()].map((a) => a.metadata);
  }
}
