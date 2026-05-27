/**
 * @jarvis/hermes — Hermes agent + adapter + SearchSkill pipeline (Phase 16).
 */

import type { AgentRegistryContract, SkillExecutor } from "@jarvis/agents-shared";

import type { HermesAdapter } from "../adapter/src/hermes-adapter";
import { createHermesAdapterStub } from "../adapter/src/hermes-adapter-stub";
import { HermesAgent } from "./hermes-agent";
import { HERMES_AGENT_ID, HERMES_METADATA } from "./metadata";

export { HermesAgent } from "./hermes-agent";
export { HERMES_AGENT_ID, HERMES_METADATA } from "./metadata";
export * from "../adapter/src";
export * from "./gateway";
export * from "./runtime";

/** Create Hermes with {@link SkillExecutor} and optional {@link HermesAdapter}. */
export function createHermesAgent(
  skillExecutor: SkillExecutor,
  adapter: HermesAdapter = createHermesAdapterStub(),
): HermesAgent {
  return new HermesAgent(skillExecutor, adapter);
}

export async function registerHermesAgent(
  registry: AgentRegistryContract,
  skillExecutor: SkillExecutor,
  adapter: HermesAdapter = createHermesAdapterStub(),
): Promise<HermesAgent> {
  const agent = createHermesAgent(skillExecutor, adapter);
  await registry.register(agent);
  return agent;
}
