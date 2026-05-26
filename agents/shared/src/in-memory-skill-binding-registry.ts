import type { AgentSkillBinding, AgentSkillBindingRegistry } from "./agent-skill-binding";

/**
 * In-memory {@link AgentSkillBindingRegistry} (Phase 11).
 */
export class InMemorySkillBindingRegistry implements AgentSkillBindingRegistry {
  readonly registryId = "agent-skill-binding-registry" as const;

  private readonly bindings = new Map<string, AgentSkillBinding>();

  async register(binding: AgentSkillBinding): Promise<void> {
    this.bindings.set(binding.agentId, binding);
  }

  async unregister(agentId: string): Promise<boolean> {
    return this.bindings.delete(agentId);
  }

  async resolve(agentId: string): Promise<AgentSkillBinding | undefined> {
    return this.bindings.get(agentId);
  }

  async list(): Promise<readonly AgentSkillBinding[]> {
    return [...this.bindings.values()];
  }
}
