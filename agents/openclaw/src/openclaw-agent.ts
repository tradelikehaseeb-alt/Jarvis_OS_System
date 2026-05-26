import {
  AbstractBaseAgent,
  BROWSER_SKILL_ID,
  FILE_SKILL_ID,
  type AgentContext,
  type AgentResult,
  type AgentTask,
  type SkillExecutionRequest,
  type SkillExecutor,
} from "@jarvis/agents-shared";

import type { OpenClawAdapter } from "../adapter/src/openclaw-adapter";
import { createOpenClawAdapterStub } from "../adapter/src/openclaw-adapter-stub";
import { buildOpenClawRequest } from "../adapter/src/build-openclaw-request";
import { OPENCLAW_AGENT_ID, OPENCLAW_METADATA } from "./metadata";

/**
 * OpenClaw gateway — {@link OpenClawAdapter} boundary + skills via {@link SkillExecutor} (Phase 16).
 * No real automation; adapter and skills return static data only.
 */
export class OpenClawAgent extends AbstractBaseAgent {
  readonly metadata = OPENCLAW_METADATA;

  constructor(
    private readonly skillExecutor: SkillExecutor,
    private readonly adapter: OpenClawAdapter = createOpenClawAdapterStub(),
  ) {
    super();
  }

  async execute(task: AgentTask, context: AgentContext): Promise<AgentResult> {
    const adapterResponse = await this.adapter.invoke(
      buildOpenClawRequest(task, context.contextRef),
    );

    if (!adapterResponse.success) {
      return {
        taskId: task.taskId,
        requestId: task.requestId,
        agentId: OPENCLAW_AGENT_ID,
        success: false,
        payload: { adapter: adapterResponse, stub: true },
        error: adapterResponse.error,
      };
    }

    const base = {
      executionId: `exec-${task.requestId}`,
      agentId: OPENCLAW_AGENT_ID,
      userId: task.userId,
      contextRef: context.contextRef,
      workflowStepId: task.workflowStepId,
      correlationId: task.correlationId,
    };

    const browserResponse = await this.skillExecutor.execute(
      {
        ...base,
        skillId: BROWSER_SKILL_ID,
        parameters: {
          action: "navigate",
          url: "https://stub.local/task",
          intent: task.intent,
          handleId: adapterResponse.execution.handleId,
        },
      },
      context,
    );

    const fileResponse = await this.skillExecutor.execute(
      {
        ...base,
        executionId: `${base.executionId}-file`,
        skillId: FILE_SKILL_ID,
        parameters: {
          operation: "read",
          path: "/stub/workspace/output.txt",
          intent: task.intent,
          handleId: adapterResponse.execution.handleId,
        },
      },
      context,
    );

    const success = browserResponse.success && fileResponse.success;

    return {
      taskId: task.taskId,
      requestId: task.requestId,
      agentId: OPENCLAW_AGENT_ID,
      success,
      payload: {
        stub: true,
        adapter: adapterResponse,
        execution: {
          ...adapterResponse.execution,
          workflowStepId: task.workflowStepId,
          contextRef: context.contextRef,
        },
        browser: browserResponse.data,
        file: fileResponse.data,
        skillExecutions: [browserResponse, fileResponse],
      },
      error: browserResponse.error ?? fileResponse.error,
    };
  }
}
