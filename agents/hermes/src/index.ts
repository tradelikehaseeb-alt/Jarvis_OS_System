/**
 * @jarvis/hermes — Hermes agent + SearchSkill pipeline (Phase 13).
 */

import type { AgentRegistryContract, SkillExecutor } from "@jarvis/agents-shared";

import { HermesAgent } from "./hermes-agent";
import { HERMES_AGENT_ID, HERMES_METADATA } from "./metadata";

export { HermesAgent } from "./hermes-agent";
export { HERMES_AGENT_ID, HERMES_METADATA } from "./metadata";

/** Create Hermes with required {@link SkillExecutor}. */
export function createHermesAgent(skillExecutor: SkillExecutor): HermesAgent {
  return new HermesAgent(skillExecutor);
}

export async function registerHermesAgent(
  registry: AgentRegistryContract,
  skillExecutor: SkillExecutor,
): Promise<HermesAgent> {
  const agent = createHermesAgent(skillExecutor);
  await registry.register(agent);
  return agent;
}
