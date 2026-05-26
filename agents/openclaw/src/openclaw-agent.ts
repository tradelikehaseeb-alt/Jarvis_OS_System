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

import { OPENCLAW_AGENT_ID, OPENCLAW_METADATA } from "./metadata";

/**
 * OpenClaw gateway — dispatches BrowserSkill + FileSkill via {@link SkillExecutor} (Phase 13).
 * No real automation; static skill outputs only.
 */
export class OpenClawAgent extends AbstractBaseAgent {
  readonly metadata = OPENCLAW_METADATA;

  constructor(private readonly skillExecutor: SkillExecutor) {
    super();
  }

  async execute(task: AgentTask, context: AgentContext): Promise<AgentResult> {
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
        execution: {
          status: "accepted",
          sandbox: true,
          permissionsChecked: false,
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
