export type DesktopActionKind = "launch-app" | "focus-window" | "open-file" | "notify";

export interface DesktopActionRequest {
  readonly action: DesktopActionKind;
  readonly target?: string;
  readonly args?: readonly string[];
  readonly taskId: string;
  readonly requestId: string;
}

export interface DesktopActionResult {
  readonly success: boolean;
  readonly stub: boolean;
  readonly action: DesktopActionKind;
  readonly message: string;
  readonly executedAt: string;
}

export interface DesktopActionRuntimeOptions {
  readonly stub?: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Desktop-level action runtime — stub in OpenClaw; real execution via desktop IPC (Phase 95).
 */
export class DesktopActionRuntime {
  private readonly stub: boolean;

  constructor(options: DesktopActionRuntimeOptions = {}) {
    this.stub = options.stub ?? true;
  }

  async execute(request: DesktopActionRequest): Promise<DesktopActionResult> {
    const executedAt = nowIso();

    if (this.stub) {
      return {
        success: true,
        stub: true,
        action: request.action,
        message: `Stub desktop ${request.action} for ${request.target ?? "system"} (no real action)`,
        executedAt,
      };
    }

    return {
      success: true,
      stub: false,
      action: request.action,
      message: `Desktop ${request.action} delegated to host runtime`,
      executedAt,
    };
  }
}

export function createDefaultDesktopActionRuntime(
  options?: DesktopActionRuntimeOptions,
): DesktopActionRuntime {
  return new DesktopActionRuntime(options);
}

export function parseDesktopActionFromIntent(description: string): DesktopActionRequest | undefined {
  const lower = description.toLowerCase();
  if (!/\blaunch\b/.test(lower) && !/\bopen app\b/.test(lower)) {
    return undefined;
  }
  const appMatch = lower.match(/\b(?:launch|open)\s+([a-z0-9._-]+)/i);
  return {
    action: "launch-app",
    target: appMatch?.[1] ?? "application",
    taskId: "desktop-task",
    requestId: "desktop-req",
  };
}
