import type { BrowserExecutionRequest } from "./browser-execution-request";
import type { BrowserExecutionResult } from "./browser-execution-result";
import type { BrowserActionPipeline } from "./browser-action-pipeline";
import type { BrowserRuntimeBootstrap } from "./browser-runtime-bootstrap";
import type { BrowserRuntimeHealth } from "./browser-runtime-health";
import type {
  BrowserRuntimeSession,
  BrowserRuntimeSessionSnapshot,
} from "./browser-runtime-session";
import type { BrowserRuntimeState } from "./browser-runtime-state";
import { createDefaultBrowserActionPipeline } from "./create-default-browser-action-pipeline";
import { createDefaultBrowserRuntimeBootstrap } from "./create-default-browser-runtime-bootstrap";
import { mapBrowserExecutionToActionRequest } from "./map-browser-execution-to-action-request";

export interface CreateBrowserRuntimeSessionOptions {
  readonly stub?: boolean;
  readonly sessionId?: string;
  readonly actionPipeline?: BrowserActionPipeline;
}

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `browser-session-${sessionCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

class DefaultBrowserRuntimeSession implements BrowserRuntimeSession {
  readonly sessionId: string;
  state: BrowserRuntimeState = "idle";
  private readonly stub: boolean;
  private readonly actionPipeline: BrowserActionPipeline;
  private runtimeHealth: BrowserRuntimeHealth | undefined;
  private initializedAt: string | undefined;

  constructor(options: CreateBrowserRuntimeSessionOptions = {}) {
    this.sessionId = options.sessionId ?? nextSessionId();
    this.stub = options.stub ?? true;
    this.actionPipeline =
      options.actionPipeline ?? createDefaultBrowserActionPipeline({ stub: this.stub });
  }

  async initializeSession(): Promise<BrowserRuntimeSessionSnapshot> {
    this.state = "initializing";
    this.initializedAt = nowIso();
    this.state = "idle";

    return {
      sessionId: this.sessionId,
      state: this.state,
      initializedAt: this.initializedAt,
    };
  }

  async validateBrowser(): Promise<BrowserRuntimeHealth> {
    const checkedAt = nowIso();

    this.runtimeHealth = {
      valid: true,
      stub: this.stub,
      available: true,
      message: this.stub
        ? "Browser runtime stub validated (no real automation)"
        : "Browser runtime validated (connection path only)",
      checkedAt,
    };

    this.state = "validated";
    return this.runtimeHealth;
  }

  async executeBrowserTask(
    request: BrowserExecutionRequest,
  ): Promise<BrowserExecutionResult> {
    const health = this.runtimeHealth ?? (await this.validateBrowser());

    if (!health.valid) {
      this.state = "failed";
      return {
        success: false,
        stub: this.stub,
        action: request.action,
        url: request.url,
        status: "failed",
        message: health.message,
        executedAt: nowIso(),
        screenshotRef: null,
      };
    }

    this.state = "executing";

    const actionRequest = mapBrowserExecutionToActionRequest(request);

    if (actionRequest) {
      const actionResult = await this.actionPipeline.executeAction(actionRequest);

      this.state = actionResult.success ? "completed" : "failed";

      return {
        success: actionResult.success,
        stub: actionResult.stub,
        action: request.action,
        url: request.url,
        status: actionResult.status,
        message: actionResult.message,
        executedAt: actionResult.executedAt,
        screenshotRef: actionResult.screenshotRef ?? null,
      };
    }

    const result: BrowserExecutionResult = {
      success: true,
      stub: request.stub ?? this.stub,
      action: request.action,
      url: request.url,
      status: "completed",
      message: "Browser task validated and stub-executed (no real browsing)",
      executedAt: nowIso(),
      screenshotRef: null,
    };

    this.state = "completed";
    return result;
  }

  async terminateSession(): Promise<BrowserRuntimeSessionSnapshot> {
    this.state = "terminated";

    return {
      sessionId: this.sessionId,
      state: this.state,
      initializedAt: this.initializedAt,
      terminatedAt: nowIso(),
    };
  }
}

/**
 * Factory for browser runtime session — stub path by default (Phase 61).
 */
export function createBrowserRuntimeSession(
  options?: CreateBrowserRuntimeSessionOptions,
): BrowserRuntimeSession {
  return new DefaultBrowserRuntimeSession(options);
}

/**
 * Runs browser validation + stub execution for gateway requests (Phase 61, 68).
 * Uses {@link BrowserRuntimeBootstrap} by default; pass an explicit session to preserve direct stub path.
 */
export async function runBrowserRuntimePath(
  request: BrowserExecutionRequest,
  session?: BrowserRuntimeSession,
  options?: { readonly bootstrap?: BrowserRuntimeBootstrap },
): Promise<BrowserExecutionResult> {
  if (session) {
    await session.initializeSession();
    await session.validateBrowser();
    const result = await session.executeBrowserTask(request);
    await session.terminateSession();
    return result;
  }

  const bootstrap =
    options?.bootstrap ?? createDefaultBrowserRuntimeBootstrap();

  await bootstrap.initializeRuntime();
  await bootstrap.validateRuntime();
  const { session: execSession } = await bootstrap.createSession();

  try {
    return await execSession.executeBrowserTask(request);
  } finally {
    await bootstrap.terminateRuntime();
  }
}
