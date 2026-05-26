import {
  AbstractBaseAgent,
  SEARCH_SKILL_ID,
  type AgentContext,
  type AgentResult,
  type AgentTask,
  type SkillExecutionRequest,
  type SkillExecutor,
} from "@jarvis/agents-shared";

import { HERMES_AGENT_ID, HERMES_METADATA } from "./metadata";

const STUB_PLAN_STEPS = ["stub-plan", "stub-review"] as const;

/**
 * Hermes agent — dispatches {@link SearchSkill} via {@link SkillExecutor} (Phase 13).
 */
export class HermesAgent extends AbstractBaseAgent {
  readonly metadata = HERMES_METADATA;

  constructor(private readonly skillExecutor: SkillExecutor) {
    super();
  }

  async execute(task: AgentTask, context: AgentContext): Promise<AgentResult> {
    const skillRequest: SkillExecutionRequest = {
      executionId: `exec-${task.requestId}`,
      agentId: HERMES_AGENT_ID,
      skillId: SEARCH_SKILL_ID,
      userId: task.userId,
      parameters: {
        query: task.intent.description,
        intent: task.intent,
        taskId: task.taskId,
      },
      contextRef: context.contextRef,
      workflowStepId: task.workflowStepId,
      correlationId: task.correlationId,
    };

    const skillResponse = await this.skillExecutor.execute(skillRequest, context);

    return {
      taskId: task.taskId,
      requestId: task.requestId,
      agentId: HERMES_AGENT_ID,
      success: skillResponse.success,
      payload: {
        stub: true,
        plan: {
          steps: STUB_PLAN_STEPS,
          intentKind: task.intent.kind,
        },
        search: skillResponse.data,
        skillExecution: skillResponse,
        memoryAccess: "via-memory-service-api-only",
      },
      error: skillResponse.error,
    };
  }
}
