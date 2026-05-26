import type { SkillRegistry } from "@jarvis/skills-shared";
import type { SkillContext, SkillInput } from "@jarvis/skills-shared";

import type { AgentContext } from "./agent-context";
import type { AgentSkillBindingRegistry } from "./agent-skill-binding";
import type { SkillExecutionRequest } from "./skill-execution-request";
import type { SkillExecutionResponse } from "./skill-execution-response";

/**
 * Executes skills on behalf of agents — **SkillRegistry only** (Phase 11).
 *
 * No direct skill imports, no bypassing registry, no memory persistence.
 */
export interface SkillExecutor {
  readonly executorId: "skill-executor";

  execute(
    request: SkillExecutionRequest,
    agentContext: AgentContext,
  ): Promise<SkillExecutionResponse>;
}

/**
 * Default {@link SkillExecutor} — validates bindings, resolves via {@link SkillRegistry}.
 */
export class DefaultSkillExecutor implements SkillExecutor {
  readonly executorId = "skill-executor" as const;

  constructor(
    private readonly skillRegistry: SkillRegistry,
    private readonly bindings: AgentSkillBindingRegistry,
  ) {}

  async execute(
    request: SkillExecutionRequest,
    agentContext: AgentContext,
  ): Promise<SkillExecutionResponse> {
    const binding = await this.bindings.resolve(request.agentId);
    if (!binding?.skillIds.includes(request.skillId)) {
      return {
        executionId: request.executionId,
        agentId: request.agentId,
        skillId: request.skillId,
        success: false,
        error: {
          code: "SKILL_NOT_BOUND",
          message: `Agent ${request.agentId} is not bound to skill ${request.skillId}`,
        },
      };
    }

    const skill = await this.skillRegistry.resolve(request.skillId);
    if (!skill) {
      return {
        executionId: request.executionId,
        agentId: request.agentId,
        skillId: request.skillId,
        success: false,
        error: {
          code: "SKILL_NOT_FOUND",
          message: `Skill ${request.skillId} is not registered`,
        },
      };
    }

    const skillInput: SkillInput = {
      invocationId: request.executionId,
      skillId: request.skillId,
      agentId: request.agentId,
      userId: request.userId,
      parameters: request.parameters,
      correlationId: request.correlationId,
    };

    const skillContext: SkillContext = {
      contextRef: request.contextRef,
      userId: request.userId,
      agentId: request.agentId,
      workflowStepId: request.workflowStepId,
      memoryApiRef: agentContext.memoryApiRef,
      metadata: agentContext.metadata,
    };

    const output = await skill.execute(skillInput, skillContext);

    return {
      executionId: request.executionId,
      agentId: request.agentId,
      skillId: request.skillId,
      success: output.success,
      data: output.data,
      error: output.error,
    };
  }
}
