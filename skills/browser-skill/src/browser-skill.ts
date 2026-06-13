import { exec } from "node:child_process";
import { promisify } from "node:util";

import {
  AbstractBaseSkill,
  type SkillContext,
  type SkillInput,
  type SkillOutput,
} from "@jarvis/skills-shared";

import { BROWSER_SKILL_ID, BROWSER_SKILL_METADATA } from "./metadata";

const execAsync = promisify(exec);

const SUCCESS_MESSAGE = "Successfully executed browser action";

const NATIVE_OPEN_ACTIONS = new Set([
  "open",
  "play",
  "navigate",
  "open-page",
  "workflow",
  "browser-action",
]);

const WINDOWS_BROWSER_PROCESSES = ["msedge.exe", "chrome.exe", "firefox.exe"] as const;

function readRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function isValidBrowserUrl(url: string | undefined): url is string {
  if (!url || url.includes("stub.local")) {
    return false;
  }

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function shouldNativeOpen(action: string): boolean {
  const normalized = action.toLowerCase();
  if (NATIVE_OPEN_ACTIONS.has(normalized)) {
    return true;
  }
  return normalized.includes("open") || normalized.includes("play");
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildOpenCommand(url: string, platform: NodeJS.Platform = process.platform): string {
  const escaped = url.replace(/"/g, '\\"');

  switch (platform) {
    case "win32":
      return `start "" "${escaped}"`;
    case "darwin":
      return `open "${escaped}"`;
    default:
      return `xdg-open "${escaped}"`;
  }
}

async function executeNativeOpen(
  url: string,
  platform: NodeJS.Platform = process.platform,
): Promise<{ readonly success: boolean; readonly message: string }> {
  try {
    await execAsync(buildOpenCommand(url, platform), {
      windowsHide: true,
    });
    return { success: true, message: SUCCESS_MESSAGE };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to open ${url}: ${detail}`,
    };
  }
}

async function executeCloseWindow(
  platform: NodeJS.Platform = process.platform,
): Promise<{ readonly success: boolean; readonly message: string }> {
  try {
    if (platform === "win32") {
      let closedAny = false;
      for (const processName of WINDOWS_BROWSER_PROCESSES) {
        try {
          await execAsync(`taskkill /IM ${processName} /F`, { windowsHide: true });
          closedAny = true;
        } catch {
          // Browser process may not be running — continue safely.
        }
      }
      return {
        success: true,
        message: closedAny
          ? SUCCESS_MESSAGE
          : "No active browser process found to close",
      };
    }

    if (platform === "darwin") {
      const commands = [
        'osascript -e \'quit app "Google Chrome"\'',
        'osascript -e \'quit app "Microsoft Edge"\'',
        'osascript -e \'quit app "Firefox"\'',
      ];
      for (const command of commands) {
        try {
          await execAsync(command, { windowsHide: true });
        } catch {
          // App may not be open.
        }
      }
      return { success: true, message: SUCCESS_MESSAGE };
    }

    const commands = ["pkill -x chrome", "pkill -x chromium", "pkill -x firefox"];
    for (const command of commands) {
      try {
        await execAsync(command, { windowsHide: true });
      } catch {
        // Process may not be running.
      }
    }
    return { success: true, message: SUCCESS_MESSAGE };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to close browser window: ${detail}`,
    };
  }
}

function buildRuntimeResultRecord(input: {
  readonly success: boolean;
  readonly action: string;
  readonly url: string;
  readonly message: string;
  readonly invocationId: string;
  readonly stub?: boolean;
}): Readonly<Record<string, unknown>> {
  return {
    success: input.success,
    stub: input.stub ?? false,
    action: input.action,
    url: input.url,
    status: input.success ? "completed" : "failed",
    message: input.message,
    executedAt: nowIso(),
    screenshotRef: null,
    nativeOpen: true,
    browserState: {
      sessionId: `native-browser-${input.invocationId}`,
      url: input.url,
      active: input.action !== "close_window" && input.success,
      stub: false,
    },
  };
}

/**
 * Browser skill — native OS open/close when Playwright is unavailable or real mode is enabled.
 */
export class BrowserSkill extends AbstractBaseSkill {
  readonly metadata = BROWSER_SKILL_METADATA;

  async execute(input: SkillInput, _context: SkillContext): Promise<SkillOutput> {
    try {
      let runtimeResult = readRecord(input.parameters.browserRuntimeResult);
      const action =
        typeof runtimeResult?.action === "string"
          ? runtimeResult.action
          : typeof input.parameters.action === "string"
            ? input.parameters.action
            : "browser-action";
      const url =
        typeof runtimeResult?.url === "string"
          ? runtimeResult.url
          : typeof input.parameters.url === "string"
            ? input.parameters.url
            : undefined;

      const normalizedAction = action.toLowerCase();

      if (normalizedAction === "close_window") {
        const closeResult = await executeCloseWindow();
        runtimeResult = buildRuntimeResultRecord({
          success: closeResult.success,
          action,
          url: url ?? "",
          message: closeResult.message,
          invocationId: input.invocationId,
          stub: false,
        });
      } else {
        const needsNativeOpen =
          isValidBrowserUrl(url) &&
          shouldNativeOpen(action) &&
          (!runtimeResult || runtimeResult.stub === true || runtimeResult.nativeOpen === true);

        if (needsNativeOpen) {
          const openResult = await executeNativeOpen(url);
          runtimeResult = buildRuntimeResultRecord({
            success: openResult.success,
            action,
            url,
            message: openResult.message,
            invocationId: input.invocationId,
            stub: false,
          });
        }
      }

      if (!runtimeResult) {
        return {
          invocationId: input.invocationId,
          skillId: BROWSER_SKILL_ID,
          success: false,
          error: {
            code: "BROWSER_RUNTIME_RESULT_MISSING",
            message:
              "BrowserSkill requires a URL or BrowserExecutionRuntime output; no browser result was generated.",
          },
        };
      }

      const browserState = readRecord(runtimeResult.browserState);
      const status =
        typeof runtimeResult.status === "string"
          ? runtimeResult.status
          : runtimeResult.success === true
            ? "completed"
            : "failed";
      const screenshotRef =
        typeof runtimeResult.screenshotRef === "string"
          ? runtimeResult.screenshotRef
          : null;
      const message =
        typeof runtimeResult.message === "string"
          ? runtimeResult.message
          : undefined;
      const stub =
        typeof runtimeResult.stub === "boolean" ? runtimeResult.stub : true;
      const resolvedUrl =
        typeof runtimeResult.url === "string" ? runtimeResult.url : url;

      return {
        invocationId: input.invocationId,
        skillId: BROWSER_SKILL_ID,
        success: runtimeResult.success === true,
        data: {
          stub,
          action,
          ...(resolvedUrl ? { url: resolvedUrl } : {}),
          ...(browserState ? { browserState } : {}),
          result: {
            status,
            ...(message ? { message } : {}),
            screenshotRef,
          },
        },
        ...(runtimeResult.success === true
          ? {}
          : {
              error: {
                code: "BROWSER_RUNTIME_FAILED",
                message: message ?? "Browser runtime failed",
              },
            }),
      };
    } catch (error) {
      return {
        invocationId: input.invocationId,
        skillId: BROWSER_SKILL_ID,
        success: false,
        error: {
          code: "BROWSER_SKILL_EXECUTION_ERROR",
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
