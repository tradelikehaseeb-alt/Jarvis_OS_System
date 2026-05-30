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
  type BrowserRuntimeSession,
} from "./browser-runtime";
import {
  createDefaultBrowserExecutionRuntime,
  createDefaultDesktopActionRuntime,
  parseDesktopActionFromIntent,
  type BrowserExecutionRuntime,
} from "./execution-runtime";
import { OPENCLAW_AGENT_ID, OPENCLAW_METADATA } from "./metadata";

function readSkillStubFlag(data: unknown): boolean {
  if (data === null || typeof data !== "object") {
    return true;
  }
  return (data as Readonly<Record<string, unknown>>).stub === true;
}

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
    private readonly browserExecutionRuntime: BrowserExecutionRuntime = createDefaultBrowserExecutionRuntime(),
    private readonly desktopActionRuntime = createDefaultDesktopActionRuntime(),
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

    const browserRequest = buildBrowserExecutionRequest(
      buildOpenClawGatewayRequest(task, context.contextRef),
      gatewayResponse.executionHandleId,
    );

    const browserRuntimeResult = await this.browserExecutionRuntime.execute(
      browserRequest,
    );

    const desktopAction = parseDesktopActionFromIntent(task.intent.description);
    const desktopResult = desktopAction
      ? await this.desktopActionRuntime.execute({
          ...desktopAction,
          taskId: task.taskId,
          requestId: task.requestId,
        })
      : undefined;

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
          action: browserRequest.action,
          url: browserRequest.url,
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
    const executionStub =
      browserRuntimeResult.stub ||
      gatewayResponse.stub ||
      readSkillStubFlag(browserResponse.data);

    return {
      taskId: task.taskId,
      requestId: task.requestId,
      agentId: OPENCLAW_AGENT_ID,
      success,
      payload: {
        stub: executionStub,
        adapter: adapterResponse,
        gateway: gatewayResponse,
        execution: {
          handleId: gatewayResponse.executionHandleId,
          runtimeStatus: gatewayResponse.runtimeStatus,
          workflowStepId: task.workflowStepId,
          contextRef: context.contextRef,
        },
        browserRuntime: browserRuntimeResult,
        browserState: browserRuntimeResult.browserState,
        workflowProgress: browserRuntimeResult.workflowProgress,
        desktopAction: desktopResult,
        browser: browserResponse.data,
        file: fileResponse.data,
        skillExecutions: [browserResponse, fileResponse],
      },
      error: browserResponse.error ?? fileResponse.error,
    };
  }
}
