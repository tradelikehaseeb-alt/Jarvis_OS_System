import {
  AbstractBaseAgent,
  SEARCH_SKILL_ID,
  type AgentContext,
  type AgentResult,
  type AgentTask,
  type SkillExecutionRequest,
  type SkillExecutor,
} from "@jarvis/agents-shared";

import type { HermesAdapter } from "../adapter/src/hermes-adapter";
import { createHermesAdapterStub } from "../adapter/src/hermes-adapter-stub";
import { buildHermesRequestWithContext } from "../adapter/src/build-hermes-request";
import { HERMES_AGENT_ID, HERMES_METADATA } from "./metadata";

/**
 * Hermes agent — {@link HermesAdapter} boundary + {@link SearchSkill} via {@link SkillExecutor} (Phase 16).
 */
export class HermesAgent extends AbstractBaseAgent {
  readonly metadata = HERMES_METADATA;

  constructor(
    private readonly skillExecutor: SkillExecutor,
    private readonly adapter: HermesAdapter = createHermesAdapterStub(),
  ) {
    super();
  }

  async execute(task: AgentTask, context: AgentContext): Promise<AgentResult> {
    const adapterResponse = await this.adapter.invoke(
      buildHermesRequestWithContext(task, context.contextRef),
    );

    if (!adapterResponse.success) {
      return {
        taskId: task.taskId,
        requestId: task.requestId,
        agentId: HERMES_AGENT_ID,
        success: false,
        payload: {
          adapter: adapterResponse,
          stub: adapterResponse.stub,
        },
        error: adapterResponse.error,
      };
    }

    const skillRequest: SkillExecutionRequest = {
      executionId: `exec-${task.requestId}`,
      agentId: HERMES_AGENT_ID,
      skillId: SEARCH_SKILL_ID,
      userId: task.userId,
      parameters: {
        query: task.intent.description,
        intent: task.intent,
        taskId: task.taskId,
        planSteps: adapterResponse.plan.steps,
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
        stub: adapterResponse.stub,
        adapter: adapterResponse,
        plan: adapterResponse.plan,
        structuredPlan: {
          goal: adapterResponse.plan.goal,
          steps: adapterResponse.plan.steps,
        },
        reasoning: adapterResponse.reasoning,
        search: skillResponse.data,
        skillExecution: skillResponse,
        memoryAccess: "via-memory-service-api-only",
      },
      error: skillResponse.error,
    };
  }
}
