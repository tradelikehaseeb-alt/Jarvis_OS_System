export interface BrowserWorkflowValidationInput {
  readonly command: string;
  readonly output?: Readonly<Record<string, unknown>>;
  readonly taskStatus?: string;
}

export interface BrowserWorkflowValidationResult {
  readonly command: string;
  readonly isBrowserCommand: boolean;
  readonly browserStatePresent: boolean;
  readonly workflowProgressPresent: boolean;
  readonly permissionHandled: boolean;
  readonly recoveryReady: boolean;
  readonly passed: boolean;
  readonly message: string;
}

function readRecord(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

/**
 * Validates real browser execution metadata and recovery readiness (Phase 100).
 */
export class RealBrowserWorkflowValidator {
  validate(input: BrowserWorkflowValidationInput): BrowserWorkflowValidationResult {
    const isBrowserCommand = /\b(open|navigate|browse|gmail|youtube|tradingview|workspace)\b/i.test(
      input.command,
    );

    if (!isBrowserCommand) {
      return {
        command: input.command,
        isBrowserCommand: false,
        browserStatePresent: false,
        workflowProgressPresent: false,
        permissionHandled: true,
        recoveryReady: true,
        passed: true,
        message: "Not a browser workflow command",
      };
    }

    const output = input.output ?? {};
    const executionRuntime = readRecord(output.executionRuntime);
    const browserState = executionRuntime?.browserState ?? output.browserState;
    const workflow = readRecord(executionRuntime?.workflow);
    const stability = readRecord(output.stability);

    const browserStatePresent = Boolean(browserState);
    const workflowProgressPresent =
      Array.isArray(workflow?.progress) || Boolean(executionRuntime?.workflow);
    const permissionHandled =
      executionRuntime?.permissionRequired !== true ||
      Boolean(executionRuntime?.browserState);
    const recoveryReady =
      Boolean(stability?.mode) || input.taskStatus === "completed";

    const passed =
      input.taskStatus === "completed" &&
      (browserStatePresent || workflowProgressPresent) &&
      permissionHandled;

    return {
      command: input.command,
      isBrowserCommand: true,
      browserStatePresent,
      workflowProgressPresent,
      permissionHandled,
      recoveryReady,
      passed,
      message: passed
        ? "Browser workflow validated"
        : "Browser workflow missing required execution metadata",
    };
  }
}

export function createDefaultRealBrowserWorkflowValidator(): RealBrowserWorkflowValidator {
  return new RealBrowserWorkflowValidator();
}
