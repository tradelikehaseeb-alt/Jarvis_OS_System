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
import { buildOpenClawGatewayRequest } from "./gateway/build-openclaw-gateway-request";
import {
  createDefaultOpenClawGateway,
  type OpenClawGateway,
} from "./gateway";
import {
  buildBrowserExecutionRequest,
  runBrowserRuntimePath,
  type BrowserRuntimeSession,
} from "./browser-runtime";
import { OPENCLAW_AGENT_ID, OPENCLAW_METADATA } from "./metadata";

/**
 * OpenClaw gateway — {@link OpenClawGateway} + {@link SkillExecutor} (Phase 16, 42).
 * No real automation; gateway and skills return static stub data only.
 */
export class OpenClawAgent extends AbstractBaseAgent {
  readonly metadata = OPENCLAW_METADATA;

  constructor(
    private readonly skillExecutor: SkillExecutor,
    private readonly adapter: OpenClawAdapter = createOpenClawAdapterStub(),
    private readonly gateway: OpenClawGateway = createDefaultOpenClawGateway({
      adapter,
    }),
    private readonly browserRuntimeSession?: BrowserRuntimeSession,
  ) {
    super();
  }

  async execute(task: AgentTask, context: AgentContext): Promise<AgentResult> {
    const gatewayResponse = await this.gateway.execute(
      buildOpenClawGatewayRequest(task, context.contextRef),
    );

    const adapterResponse = {
      success: gatewayResponse.success,
      adapterId: gatewayResponse.adapterId,
      stub: gatewayResponse.stub,
      execution: {
        status: gatewayResponse.success ? ("accepted" as const) : ("rejected" as const),
        sandbox: gatewayResponse.sandbox,
        permissionsChecked: gatewayResponse.permissionsChecked,
        handleId: gatewayResponse.executionHandleId,
      },
      approvedActions: gatewayResponse.approvedActions,
      error: gatewayResponse.error,
    };

    if (!gatewayResponse.success) {
      return {
        taskId: task.taskId,
        requestId: task.requestId,
        agentId: OPENCLAW_AGENT_ID,
        success: false,
        payload: {
          adapter: adapterResponse,
          gateway: gatewayResponse,
          stub: true,
        },
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

    const browserRuntimeResult = await runBrowserRuntimePath(
      buildBrowserExecutionRequest(
        buildOpenClawGatewayRequest(task, context.contextRef),
        gatewayResponse.executionHandleId,
      ),
      this.browserRuntimeSession,
    );

    if (!browserRuntimeResult.success) {
      return {
        taskId: task.taskId,
        requestId: task.requestId,
        agentId: OPENCLAW_AGENT_ID,
        success: false,
        payload: {
          adapter: adapterResponse,
          gateway: gatewayResponse,
          browserRuntime: browserRuntimeResult,
          stub: true,
        },
        error: {
          code: "BROWSER_RUNTIME_FAILED",
          message: browserRuntimeResult.message,
        },
      };
    }

    const browserResponse = await this.skillExecutor.execute(
      {
        ...base,
        skillId: BROWSER_SKILL_ID,
        parameters: {
          action: "navigate",
          url: "https://stub.local/task",
          intent: task.intent,
          handleId: gatewayResponse.executionHandleId,
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
          handleId: gatewayResponse.executionHandleId,
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
        gateway: gatewayResponse,
        execution: {
          handleId: gatewayResponse.executionHandleId,
          runtimeStatus: gatewayResponse.runtimeStatus,
          workflowStepId: task.workflowStepId,
          contextRef: context.contextRef,
        },
        browserRuntime: browserRuntimeResult,
        browser: browserResponse.data,
        file: fileResponse.data,
        skillExecutions: [browserResponse, fileResponse],
      },
      error: browserResponse.error ?? fileResponse.error,
    };
  }
}
