import type { BrowserRuntimeBootstrap } from "./browser-runtime-bootstrap";
import type { BrowserRuntimeConfig } from "./browser-runtime-config";
import type { BrowserRuntimeHealth } from "./browser-runtime-health";
import type { BrowserRuntimeSession } from "./browser-runtime-session";
import type { BrowserRuntimeSessionInfo } from "./browser-runtime-session-info";
import type { BrowserRuntimeState } from "./browser-runtime-state";
import {
  DefaultBrowserRuntimeValidator,
  type BrowserRuntimeValidator,
} from "./browser-runtime-validator";
import {
  createBrowserRuntimeSession,
  type CreateBrowserRuntimeSessionOptions,
} from "./create-browser-runtime-session";

export interface CreateDefaultBrowserRuntimeBootstrapOptions {
  readonly config?: BrowserRuntimeConfig;
  readonly validator?: BrowserRuntimeValidator;
  readonly sessionFactory?: (
    options?: CreateBrowserRuntimeSessionOptions,
  ) => BrowserRuntimeSession;
}

let bootstrapCounter = 0;

function nextBootstrapSessionId(prefix: string): string {
  bootstrapCounter += 1;
  return `${prefix}-${bootstrapCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

class DefaultBrowserRuntimeBootstrap implements BrowserRuntimeBootstrap {
  readonly config: BrowserRuntimeConfig;
  private bootstrapInfo: BrowserRuntimeSessionInfo | undefined;
  private runtimeHealth: BrowserRuntimeHealth | undefined;
  private activeSession: BrowserRuntimeSession | undefined;

  constructor(
    config: BrowserRuntimeConfig,
    private readonly validator: BrowserRuntimeValidator,
    private readonly sessionFactory: (
      options?: CreateBrowserRuntimeSessionOptions,
    ) => BrowserRuntimeSession,
  ) {
    this.config = {
      stub: true,
      sandbox: true,
      sessionIdPrefix: "browser-bootstrap",
      ...config,
    };
  }

  async initializeRuntime(): Promise<BrowserRuntimeSessionInfo> {
    const initializedAt = nowIso();
    const sessionId = nextBootstrapSessionId(
      this.config.sessionIdPrefix ?? "browser-bootstrap",
    );

    this.bootstrapInfo = {
      sessionId,
      state: "idle",
      stub: this.config.stub ?? true,
      initializedAt,
    };

    return this.bootstrapInfo;
  }

  async validateRuntime(): Promise<BrowserRuntimeHealth> {
    this.runtimeHealth = await this.validator.validate(this.config);

    if (this.bootstrapInfo) {
      this.bootstrapInfo = {
        ...this.bootstrapInfo,
        state: this.runtimeHealth.valid ? "validated" : "failed",
        validatedAt: this.runtimeHealth.checkedAt,
      };
    }

    return this.runtimeHealth;
  }

  async createSession(): Promise<{
    info: BrowserRuntimeSessionInfo;
    session: BrowserRuntimeSession;
  }> {
    const health = this.runtimeHealth ?? (await this.validateRuntime());

    if (!health.valid) {
      const failedInfo: BrowserRuntimeSessionInfo = {
        sessionId:
          this.bootstrapInfo?.sessionId ??
          nextBootstrapSessionId(
            this.config.sessionIdPrefix ?? "browser-bootstrap",
          ),
        state: "failed",
        stub: this.config.stub ?? true,
        initializedAt: this.bootstrapInfo?.initializedAt,
        validatedAt: health.checkedAt,
      };
      throw new Error(health.message);
    }

    const session = this.sessionFactory({
      stub: this.config.stub ?? true,
    });

    const initialized = await session.initializeSession();
    await session.validateBrowser();
    this.activeSession = session;

    const info: BrowserRuntimeSessionInfo = {
      sessionId: session.sessionId,
      state: session.state as BrowserRuntimeState,
      stub: this.config.stub ?? true,
      initializedAt: initialized.initializedAt ?? this.bootstrapInfo?.initializedAt,
      validatedAt: health.checkedAt,
    };

    this.bootstrapInfo = info;
    return { info, session };
  }

  async terminateRuntime(): Promise<BrowserRuntimeSessionInfo> {
    const terminatedAt = nowIso();

    if (this.activeSession) {
      const terminated = await this.activeSession.terminateSession();
      this.activeSession = undefined;

      this.bootstrapInfo = {
        sessionId: terminated.sessionId,
        state: terminated.state,
        stub: this.config.stub ?? true,
        initializedAt: terminated.initializedAt ?? this.bootstrapInfo?.initializedAt,
        validatedAt: this.bootstrapInfo?.validatedAt,
        terminatedAt: terminated.terminatedAt ?? terminatedAt,
      };

      return this.bootstrapInfo;
    }

    this.bootstrapInfo = {
      sessionId:
        this.bootstrapInfo?.sessionId ??
        nextBootstrapSessionId(
          this.config.sessionIdPrefix ?? "browser-bootstrap",
        ),
      state: "terminated",
      stub: this.config.stub ?? true,
      initializedAt: this.bootstrapInfo?.initializedAt,
      validatedAt: this.bootstrapInfo?.validatedAt,
      terminatedAt,
    };

    return this.bootstrapInfo;
  }
}

/**
 * Factory for default browser runtime bootstrap — stub fallback (Phase 68).
 */
export function createDefaultBrowserRuntimeBootstrap(
  options?: CreateDefaultBrowserRuntimeBootstrapOptions,
): BrowserRuntimeBootstrap {
  return new DefaultBrowserRuntimeBootstrap(
    options?.config ?? {},
    options?.validator ?? new DefaultBrowserRuntimeValidator(),
    options?.sessionFactory ?? createBrowserRuntimeSession,
  );
}
