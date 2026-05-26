import { createBrowserSkill } from "@jarvis/browser-skill";
import { createFileSkill } from "@jarvis/file-skill";
import { createSearchSkill } from "@jarvis/search-skill";
import { InMemorySkillRegistry } from "@jarvis/skills-shared";
import type { SkillRegistry } from "@jarvis/skills-shared";

import type { AgentSkillBindingRegistry } from "./agent-skill-binding";
import { InMemorySkillBindingRegistry } from "./in-memory-skill-binding-registry";
import {
  BROWSER_SKILL_ID,
  FILE_SKILL_ID,
  SEARCH_SKILL_ID,
} from "./pipeline-ids";
import { DefaultSkillExecutor, type SkillExecutor } from "./skill-executor";

/** Agent ids aligned with @jarvis/hermes and @jarvis/openclaw. */
export const HERMES_AGENT_ID_PIPELINE = "hermes" as const;
export const OPENCLAW_AGENT_ID_PIPELINE = "openclaw-gateway" as const;

export interface SkillPipelineWiring {
  readonly skillRegistry: SkillRegistry;
  readonly bindings: AgentSkillBindingRegistry;
  readonly skillExecutor: SkillExecutor;
}

/**
 * Register concrete skills and agent bindings (Phase 13).
 */
export async function createDefaultSkillPipeline(
  skillRegistry: SkillRegistry = new InMemorySkillRegistry(),
  bindings: AgentSkillBindingRegistry = new InMemorySkillBindingRegistry(),
): Promise<SkillPipelineWiring> {
  await skillRegistry.register(createSearchSkill());
  await skillRegistry.register(createFileSkill());
  await skillRegistry.register(createBrowserSkill());

  await bindings.register({
    agentId: HERMES_AGENT_ID_PIPELINE,
    skillIds: [SEARCH_SKILL_ID],
  });

  await bindings.register({
    agentId: OPENCLAW_AGENT_ID_PIPELINE,
    skillIds: [BROWSER_SKILL_ID, FILE_SKILL_ID],
  });

  const skillExecutor = new DefaultSkillExecutor(skillRegistry, bindings);

  return { skillRegistry, bindings, skillExecutor };
}

/**
 * @deprecated Use {@link createDefaultSkillPipeline} — kept for test compatibility.
 */
export const createStubSkillPipeline = createDefaultSkillPipeline;
