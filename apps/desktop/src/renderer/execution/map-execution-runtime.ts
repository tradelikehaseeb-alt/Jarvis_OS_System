import type {
  BrowserStateView,
  ExecutionPermissionView,
  ExecutionRuntimeView,
} from "./execution-runtime-types";

function readRecord(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function safeHostname(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

/**
 * Maps orchestrator task output to user-facing execution runtime view (Phase 95).
 */
export function mapExecutionRuntimeFromTaskOutput(
  output: Readonly<Record<string, unknown>> | undefined,
): ExecutionRuntimeView | undefined {
  const executionRuntime = readRecord(output?.executionRuntime);
  if (!executionRuntime) {
    return undefined;
  }

  const browserRaw = readRecord(executionRuntime.browserState);
  const browserState: BrowserStateView | undefined = browserRaw
    ? {
        sessionId: String(browserRaw.sessionId ?? ""),
        url: String(browserRaw.url ?? ""),
        title: typeof browserRaw.title === "string" ? browserRaw.title : undefined,
        active: Boolean(browserRaw.active),
        stub: Boolean(browserRaw.stub),
        stepIndex:
          typeof browserRaw.stepIndex === "number" ? browserRaw.stepIndex : undefined,
        totalSteps:
          typeof browserRaw.totalSteps === "number" ? browserRaw.totalSteps : undefined,
      }
    : undefined;

  const permission: ExecutionPermissionView | undefined =
    executionRuntime.permissionRequired === true
      ? {
          required: true,
          message: "Jarvis needs permission to continue this action",
          domain: safeHostname(browserState?.url),
        }
      : undefined;

  const workflowRaw = readRecord(executionRuntime.workflow);
  const progressRaw = workflowRaw?.progress;
  const workflowProgress = Array.isArray(progressRaw)
    ? progressRaw
        .map((entry) => {
          const step = readRecord(entry);
          return typeof step?.message === "string" ? step.message : undefined;
        })
        .filter((entry): entry is string => Boolean(entry))
    : undefined;

  return {
    browserState,
    permission,
    workflowProgress,
  };
}
