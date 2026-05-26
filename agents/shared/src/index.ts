/**
 * @jarvis/agents-shared — agent framework + agent→skill pipeline (Phase 11).
 */

export type { AgentCapability, AgentCapabilityKind } from "./agent-capability";
export type { AgentMetadata } from "./agent-metadata";
export type { AgentTask } from "./agent-task";
export type { AgentError, AgentResult } from "./agent-result";
export type { AgentContext } from "./agent-context";
export type { BaseAgent } from "./base-agent";
export { AbstractBaseAgent } from "./base-agent";
export type { AgentRegistryContract } from "./agent-registry-contract";
export { InMemoryAgentRegistry } from "./in-memory-agent-registry";

export type { SkillExecutionRequest } from "./skill-execution-request";
export type {
  SkillExecutionError,
  SkillExecutionResponse,
} from "./skill-execution-response";
export type {
  AgentSkillBinding,
  AgentSkillBindingRegistry,
} from "./agent-skill-binding";
export { InMemorySkillBindingRegistry } from "./in-memory-skill-binding-registry";
export type { SkillExecutor } from "./skill-executor";
export { DefaultSkillExecutor } from "./skill-executor";
export { PipelineStubSkill } from "./pipeline-stub-skill";
export {
  HERMES_PLAN_SKILL_STUB,
  OPENCLAW_EXECUTE_SKILL_STUB,
} from "./pipeline-ids";
export {
  createDefaultSkillPipeline,
  createStubSkillPipeline,
  HERMES_AGENT_ID_PIPELINE,
  OPENCLAW_AGENT_ID_PIPELINE,
  type SkillPipelineWiring,
} from "./create-skill-pipeline";
export {
  SEARCH_SKILL_ID,
  FILE_SKILL_ID,
  BROWSER_SKILL_ID,
} from "./pipeline-ids";
