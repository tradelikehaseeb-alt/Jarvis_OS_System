/**
 * @jarvis/agents-bootstrap — agents, skill pipeline, provider selection (Phase 17).
 */

import type { AgentRegistryContract } from "@jarvis/agents-shared";
import { InMemoryAgentRegistry } from "@jarvis/agents-shared";
import {
  createDefaultSkillPipeline,
  type SkillPipelineWiring,
} from "@jarvis/agents-shared";
import type { HermesAgent } from "@jarvis/hermes";
import {
  createResolvedHermesAdapter,
  registerHermesAgent,
} from "@jarvis/hermes";
import type { OpenClawAgent } from "@jarvis/openclaw";
import {
  createOpenClawAdapterFromProvider,
  registerOpenClawAgent,
} from "@jarvis/openclaw";
import type { ProviderConfig } from "@jarvis/provider-registry";
import {
  createDefaultProviderResolver,
  type ProviderResolver,
} from "@jarvis/provider-registry";

export interface RegisterDefaultAgentsOptions {
  readonly providerConfig?: ProviderConfig;
  readonly providerResolver?: ProviderResolver;
}

export interface DefaultAgentsRegistration {
  readonly registry: AgentRegistryContract;
  readonly pipeline: SkillPipelineWiring;
  readonly providerResolver: ProviderResolver;
  readonly hermes: HermesAgent;
  readonly openClaw: OpenClawAgent;
}

/**
 * Register skills, provider-selected adapters, and Hermes + OpenClaw agents.
 */
export async function registerDefaultAgents(
  registry: AgentRegistryContract = new InMemoryAgentRegistry(),
  options: RegisterDefaultAgentsOptions = {},
): Promise<DefaultAgentsRegistration> {
  const pipeline = await createDefaultSkillPipeline();
  const providerResolver =
    options.providerResolver ??
    createDefaultProviderResolver(options.providerConfig);

  const hermes = await registerHermesAgent(
    registry,
    pipeline.skillExecutor,
    createResolvedHermesAdapter(providerResolver),
  );
  const openClaw = await registerOpenClawAgent(
    registry,
    pipeline.skillExecutor,
    createOpenClawAdapterFromProvider(providerResolver),
  );

  return { registry, pipeline, providerResolver, hermes, openClaw };
}
