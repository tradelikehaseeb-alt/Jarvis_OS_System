import type { BrowserExecutionRequest } from "./browser-execution-request";
import type { BrowserExecutionResult } from "./browser-execution-result";
import type { BrowserRuntimeHealth } from "./browser-runtime-health";
import type {
  BrowserRuntimeSession,
  BrowserRuntimeSessionSnapshot,
} from "./browser-runtime-session";
import type { BrowserRuntimeState } from "./browser-runtime-state";

export interface CreateBrowserRuntimeSessionOptions {
  readonly stub?: boolean;
  readonly sessionId?: string;
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
  private runtimeHealth: BrowserRuntimeHealth | undefined;
  private initializedAt: string | undefined;

  constructor(options: CreateBrowserRuntimeSessionOptions = {}) {
    this.sessionId = options.sessionId ?? nextSessionId();
    this.stub = options.stub ?? true;
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
 * Runs browser validation + stub execution for gateway requests (Phase 61).
 */
export async function runBrowserRuntimePath(
  request: BrowserExecutionRequest,
  session: BrowserRuntimeSession = createBrowserRuntimeSession(),
): Promise<BrowserExecutionResult> {
  await session.initializeSession();
  await session.validateBrowser();
  const result = await session.executeBrowserTask(request);
  await session.terminateSession();
  return result;
}
