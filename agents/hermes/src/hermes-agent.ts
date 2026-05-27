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
import { buildHermesGatewayRequest } from "./gateway/build-hermes-gateway-request";
import {
  createDefaultHermesGateway,
  type HermesGateway,
} from "./gateway";
import { HERMES_AGENT_ID, HERMES_METADATA } from "./metadata";

/**
 * Hermes agent — {@link HermesGateway} + {@link SearchSkill} via {@link SkillExecutor} (Phase 16, 43).
 */
export class HermesAgent extends AbstractBaseAgent {
  readonly metadata = HERMES_METADATA;

  constructor(
    private readonly skillExecutor: SkillExecutor,
    private readonly adapter: HermesAdapter = createHermesAdapterStub(),
    private readonly gateway: HermesGateway = createDefaultHermesGateway({
      adapter,
    }),
  ) {
    super();
  }

  async execute(task: AgentTask, context: AgentContext): Promise<AgentResult> {
    const gatewayResponse = await this.gateway.execute(
      buildHermesGatewayRequest(task, context.contextRef),
    );

    const adapterResponse = {
      success: gatewayResponse.success,
      adapterId: gatewayResponse.adapterId,
      stub: gatewayResponse.stub,
      plan: gatewayResponse.plan,
      reasoning: gatewayResponse.reasoning,
      error: gatewayResponse.error,
    };

    if (!gatewayResponse.success) {
      return {
        taskId: task.taskId,
        requestId: task.requestId,
        agentId: HERMES_AGENT_ID,
        success: false,
        payload: {
          adapter: adapterResponse,
          gateway: gatewayResponse,
          stub: gatewayResponse.stub,
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
        planSteps: gatewayResponse.plan.steps,
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
        stub: gatewayResponse.stub,
        adapter: adapterResponse,
        gateway: gatewayResponse,
        plan: gatewayResponse.plan,
        structuredPlan: {
          goal: gatewayResponse.plan.goal,
          steps: gatewayResponse.plan.steps,
        },
        reasoning: gatewayResponse.reasoning,
        planning: {
          runtimeStatus: gatewayResponse.runtimeStatus,
          contextRef: context.contextRef,
        },
        search: skillResponse.data,
        skillExecution: skillResponse,
        memoryAccess: "via-memory-service-api-only",
      },
      error: skillResponse.error,
    };
  }
}
