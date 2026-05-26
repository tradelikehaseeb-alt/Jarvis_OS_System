/**
 * @jarvis/openclaw — OpenClaw gateway + Browser/File skills (Phase 13).
 */

import type { AgentRegistryContract, SkillExecutor } from "@jarvis/agents-shared";

import { OPENCLAW_AGENT_ID, OPENCLAW_METADATA } from "./metadata";
import { OpenClawAgent } from "./openclaw-agent";

export { OpenClawAgent } from "./openclaw-agent";
export { OPENCLAW_AGENT_ID, OPENCLAW_METADATA } from "./metadata";

export function createOpenClawAgent(skillExecutor: SkillExecutor): OpenClawAgent {
  return new OpenClawAgent(skillExecutor);
}

export async function registerOpenClawAgent(
  registry: AgentRegistryContract,
  skillExecutor: SkillExecutor,
): Promise<OpenClawAgent> {
  const agent = createOpenClawAgent(skillExecutor);
  await registry.register(agent);
  return agent;
}
