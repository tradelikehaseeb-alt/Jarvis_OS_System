/**
 * @jarvis/openclaw — OpenClaw gateway + adapter + skills (Phase 16).
 */

import type { AgentRegistryContract, SkillExecutor } from "@jarvis/agents-shared";

import type { OpenClawAdapter } from "../adapter/src/openclaw-adapter";
import { createOpenClawAdapterStub } from "../adapter/src/openclaw-adapter-stub";
import { OPENCLAW_AGENT_ID, OPENCLAW_METADATA } from "./metadata";
import { OpenClawAgent } from "./openclaw-agent";

export { OpenClawAgent } from "./openclaw-agent";
export { OPENCLAW_AGENT_ID, OPENCLAW_METADATA } from "./metadata";
export * from "../adapter/src";
export * from "./gateway";

/** Create OpenClaw with {@link SkillExecutor} and optional {@link OpenClawAdapter}. */
export function createOpenClawAgent(
  skillExecutor: SkillExecutor,
  adapter: OpenClawAdapter = createOpenClawAdapterStub(),
): OpenClawAgent {
  return new OpenClawAgent(skillExecutor, adapter);
}

export async function registerOpenClawAgent(
  registry: AgentRegistryContract,
  skillExecutor: SkillExecutor,
  adapter: OpenClawAdapter = createOpenClawAdapterStub(),
): Promise<OpenClawAgent> {
  const agent = createOpenClawAgent(skillExecutor, adapter);
  await registry.register(agent);
  return agent;
}
