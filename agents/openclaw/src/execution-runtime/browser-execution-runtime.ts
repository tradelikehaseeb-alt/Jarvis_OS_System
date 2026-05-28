import type { BrowserExecutionRequest } from "../browser-runtime/browser-execution-request";
import type { BrowserExecutionResult } from "../browser-runtime/browser-execution-result";
import type { BrowserActionPipeline } from "../browser-runtime/browser-action-pipeline";
import type { BrowserActionRequest } from "../browser-runtime/browser-action-request";
import { createDefaultBrowserActionPipeline } from "../browser-runtime/create-default-browser-action-pipeline";
import { createBrowserRuntimeSession } from "../browser-runtime/create-browser-runtime-session";
import { mapBrowserExecutionToActionRequest } from "../browser-runtime/map-browser-execution-to-action-request";
import { resolveBrowserAction } from "../browser-runtime/browser-action";

import {
  BrowserSessionPersistence,
  createDefaultBrowserSessionPersistence,
} from "./browser-session-persistence";
import {
  ExecutionPermissionManager,
  createDefaultExecutionPermissionManager,
} from "./execution-permission-manager";
import {
  ExecutionSafetyRuntime,
  createDefaultExecutionSafetyRuntime,
} from "./execution-safety-runtime";
import { buildWorkflowProgressMessage } from "./parse-browser-intent";
import {
  createPlaywrightBrowserActionPipeline,
  tryLaunchPlaywrightPage,
} from "./create-playwright-browser-action-pipeline";

export interface BrowserStateSnapshot {
  readonly sessionId: string;
  readonly url: string;
  readonly title?: string;
  readonly active: boolean;
  readonly stub: boolean;
  readonly stepIndex?: number;
  readonly totalSteps?: number;
}

export interface BrowserExecutionRuntimeResult extends BrowserExecutionResult {
  readonly browserState?: BrowserStateSnapshot;
  readonly permissionRequired?: boolean;
  readonly workflowProgress?: readonly string[];
}

export interface BrowserExecutionRuntimeOptions {
  readonly stub?: boolean;
  readonly permissionManager?: ExecutionPermissionManager;
  readonly sessionPersistence?: BrowserSessionPersistence;
  readonly safetyRuntime?: ExecutionSafetyRuntime;
  readonly actionPipeline?: BrowserActionPipeline;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toActionRequests(request: BrowserExecutionRequest): BrowserActionRequest[] {
  if (request.workflowSteps && request.workflowSteps.length > 0) {
    return request.workflowSteps
      .map((step) => {
        const action = resolveBrowserAction(step.action);
        if (!action) {
          return undefined;
        }
        return {
          action,
          taskId: request.taskId,
          requestId: request.requestId,
          url: step.url ?? request.url,
          selector: step.selector,
          text: step.text,
          handleId: request.handleId,
          stub: request.stub,
        };
      })
      .filter((entry): entry is BrowserActionRequest => entry !== undefined);
  }

  const single = mapBrowserExecutionToActionRequest(request);
  return single ? [single] : [];
}

/**
 * Unified browser execution with session reuse, permissions, and safety (Phase 95).
 */
export class BrowserExecutionRuntime {
  private readonly stub: boolean;
  private readonly permissionManager: ExecutionPermissionManager;
  private readonly sessionPersistence: BrowserSessionPersistence;
  private readonly safetyRuntime: ExecutionSafetyRuntime;
  private readonly injectedPipeline?: BrowserActionPipeline;
  private sessionCounter = 0;

  constructor(options: BrowserExecutionRuntimeOptions = {}) {
    this.stub = options.stub ?? true;
    this.permissionManager =
      options.permissionManager ?? createDefaultExecutionPermissionManager();
    this.sessionPersistence =
      options.sessionPersistence ?? createDefaultBrowserSessionPersistence();
    this.safetyRuntime =
      options.safetyRuntime ?? createDefaultExecutionSafetyRuntime();
    this.injectedPipeline = options.actionPipeline;
  }

  async execute(request: BrowserExecutionRequest): Promise<BrowserExecutionRuntimeResult> {
    this.safetyRuntime.reset();
    const startedAt = nowIso();
    const stub = request.stub ?? this.stub;
    const actions = toActionRequests({ ...request, stub });
    const progress: string[] = [];

    const permission = this.permissionManager.evaluate({
      action: request.action,
      url: request.url,
    });

    if (!permission.allowed) {
      return {
        success: false,
        stub,
        action: request.action,
        url: request.url,
        status: "failed",
        message: permission.reason,
        executedAt: nowIso(),
        screenshotRef: null,
        permissionRequired: permission.requiresConfirmation,
      };
    }

    const reusable = this.sessionPersistence.findReusable(request.url, stub);
    const sessionId = reusable?.sessionId ?? `browser-exec-${++this.sessionCounter}`;
    const pipeline =
      this.injectedPipeline ??
      (await this.resolvePipeline(stub, sessionId));

    const session = createBrowserRuntimeSession({
      stub,
      sessionId,
      actionPipeline: pipeline,
    });

    await session.initializeSession();
    await session.validateBrowser();

    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index]!;
      const safety = this.safetyRuntime.evaluate({
        stepCount: index + 1,
        startedAt,
        lastProgressAt: progress.at(-1),
      });

      if (!safety.allowed) {
        await session.terminateSession();
        return {
          success: false,
          stub,
          action: request.action,
          url: request.url,
          status: "failed",
          message: safety.message,
          executedAt: nowIso(),
          screenshotRef: null,
          workflowProgress: progress,
          browserState: this.buildBrowserState(sessionId, request.url, stub, index, actions.length),
        };
      }

      this.safetyRuntime.recordAction(`${action.action}:${action.url ?? action.selector ?? ""}`);
      progress.push(buildWorkflowProgressMessage(index, actions.length, action.action));

      const stepResult = await session.executeBrowserTask({
        ...request,
        action: action.action,
        url: action.url ?? request.url,
        selector: action.selector,
        text: action.text,
        stub,
      });

      if (!stepResult.success) {
        await session.terminateSession();
        return {
          ...stepResult,
          browserState: this.buildBrowserState(sessionId, stepResult.url, stub, index, actions.length),
          workflowProgress: progress,
          permissionRequired: permission.requiresConfirmation,
        };
      }
    }

    const executedAt = nowIso();
    this.sessionPersistence.save({
      sessionId,
      url: request.url,
      active: true,
      stub,
      lastUsedAt: executedAt,
      createdAt: reusable?.createdAt ?? executedAt,
    });

    await session.terminateSession();

    return {
      success: true,
      stub,
      action: request.action,
      url: request.url,
      status: "completed",
      message:
        actions.length > 1
          ? `Workflow completed (${actions.length} steps)`
          : "Browser task completed",
      executedAt,
      screenshotRef: null,
      browserState: this.buildBrowserState(sessionId, request.url, stub, actions.length, actions.length),
      workflowProgress: progress,
      permissionRequired: permission.requiresConfirmation,
    };
  }

  getActiveBrowserStates(): readonly BrowserStateSnapshot[] {
    return this.sessionPersistence.listActive().map((session) => ({
      sessionId: session.sessionId,
      url: session.url ?? "",
      title: session.title,
      active: session.active,
      stub: session.stub,
    }));
  }

  cleanupInactiveSessions(): number {
    return this.sessionPersistence.cleanupIdle();
  }

  private buildBrowserState(
    sessionId: string,
    url: string,
    stub: boolean,
    stepIndex: number,
    totalSteps: number,
  ): BrowserStateSnapshot {
    return {
      sessionId,
      url,
      active: true,
      stub,
      stepIndex,
      totalSteps,
    };
  }

  private async resolvePipeline(
    stub: boolean,
    sessionId: string,
  ): Promise<BrowserActionPipeline> {
    if (stub) {
      return createDefaultBrowserActionPipeline({ stub: true });
    }

    const page = await tryLaunchPlaywrightPage();
    if (page) {
      return createPlaywrightBrowserActionPipeline({ page });
    }

    return createDefaultBrowserActionPipeline({
      stub: true,
      contextRuntime: undefined,
    });
  }
}

export function createDefaultBrowserExecutionRuntime(
  options?: BrowserExecutionRuntimeOptions,
): BrowserExecutionRuntime {
  return new BrowserExecutionRuntime(options);
}

export function createBrowserExecutionRuntime(
  options?: BrowserExecutionRuntimeOptions,
): BrowserExecutionRuntime {
  return new BrowserExecutionRuntime(options);
}
