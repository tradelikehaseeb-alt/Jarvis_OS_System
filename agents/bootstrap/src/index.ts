/**
 * @jarvis/agents-bootstrap — agents + concrete skill pipeline wiring (Phase 13).
 */

import type { AgentRegistryContract } from "@jarvis/agents-shared";
import { InMemoryAgentRegistry } from "@jarvis/agents-shared";
import {
  createDefaultSkillPipeline,
  type SkillPipelineWiring,
} from "@jarvis/agents-shared";
import type { HermesAgent } from "@jarvis/hermes";
import { registerHermesAgent } from "@jarvis/hermes";
import type { OpenClawAgent } from "@jarvis/openclaw";
import { registerOpenClawAgent } from "@jarvis/openclaw";

export interface DefaultAgentsRegistration {
  readonly registry: AgentRegistryContract;
  readonly pipeline: SkillPipelineWiring;
  readonly hermes: HermesAgent;
  readonly openClaw: OpenClawAgent;
}

/**
 * Register concrete skills, bindings, and Hermes + OpenClaw agents.
 */
export async function registerDefaultAgents(
  registry: AgentRegistryContract = new InMemoryAgentRegistry(),
): Promise<DefaultAgentsRegistration> {
  const pipeline = await createDefaultSkillPipeline();
  const hermes = await registerHermesAgent(registry, pipeline.skillExecutor);
  const openClaw = await registerOpenClawAgent(registry, pipeline.skillExecutor);
  return { registry, pipeline, hermes, openClaw };
}
