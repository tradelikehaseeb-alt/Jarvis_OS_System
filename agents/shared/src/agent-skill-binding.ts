/**
 * Declares which skills an agent may invoke through {@link SkillExecutor}.
 */
export interface AgentSkillBinding {
  readonly agentId: string;
  readonly skillIds: readonly string[];
}

/**
 * Registry for {@link AgentSkillBinding} entries.
 */
export interface AgentSkillBindingRegistry {
  readonly registryId: "agent-skill-binding-registry";

  register(binding: AgentSkillBinding): Promise<void>;

  unregister(agentId: string): Promise<boolean>;

  resolve(agentId: string): Promise<AgentSkillBinding | undefined>;

  list(): Promise<readonly AgentSkillBinding[]>;
}
