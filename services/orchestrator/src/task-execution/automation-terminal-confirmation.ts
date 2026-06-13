import type { AgentResult } from "@jarvis/agents-shared";
import type { TaskIntent } from "@jarvis/types";

import { detectRoutedIntentKind } from "../internal/intent-routing";

const CONVERSATIONAL_FILLER_PATTERNS: readonly RegExp[] = [
  /^enabled\s+toolsets\b/i,
  /\btoolsets\s*=/i,
  /^skills\s+path\b/i,
  /^planning\s+phase\b/i,
  /^hermes\s+python\s+agent\b/i,
];

const AUTOMATION_TERMINAL_MARKERS: readonly RegExp[] = [
  /"success"\s*:\s*true/i,
  /"exit_code"\s*:\s*0\b/i,
  /dynamic\s+windows\s+script\s+completed\s+successfully/i,
  /folder\s+created/i,
  /directory\s+created/i,
  /process\s+terminated/i,
  /taskkill\b/i,
  /mkdir\b/i,
  /script_path/i,
];

export function requiresAutomationTerminalConfirmation(intent: TaskIntent): boolean {
  const routed = detectRoutedIntentKind(intent);
  return (
    routed === "automate" ||
    routed === "file" ||
    routed === "local-execution" ||
    routed === "browse"
  );
}

export function isConversationalPlanningFiller(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return false;
  }
  return CONVERSATIONAL_FILLER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function collectPayloadStrings(
  payload: Readonly<Record<string, unknown>> | undefined,
  bucket: string[],
): void {
  if (!payload) {
    return;
  }

  for (const value of Object.values(payload)) {
    if (typeof value === "string" && value.trim().length > 0) {
      bucket.push(value);
      continue;
    }
    if (value !== null && typeof value === "object") {
      collectPayloadStrings(value as Readonly<Record<string, unknown>>, bucket);
    }
  }
}

function tryParseToolJson(text: string): Readonly<Record<string, unknown>> | undefined {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) {
      return undefined;
    }
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as Readonly<Record<string, unknown>>;
    } catch {
      return undefined;
    }
  }
  try {
    return JSON.parse(trimmed) as Readonly<Record<string, unknown>>;
  } catch {
    return undefined;
  }
}

export function hasAutomationTerminalConfirmation(
  agentResult: AgentResult,
  planningResult?: AgentResult,
): boolean {
  if (agentResult.payload?.stub === true || planningResult?.payload?.stub === true) {
    return true;
  }

  if (
    agentResult.payload?.browser !== undefined ||
    agentResult.payload?.file !== undefined ||
    agentResult.payload?.search !== undefined
  ) {
    return true;
  }

  const texts: string[] = [];
  collectPayloadStrings(agentResult.payload, texts);
  collectPayloadStrings(planningResult?.payload, texts);

  const planSummary = planningResult?.payload?.plan;
  if (planSummary !== null && typeof planSummary === "object") {
    const summary = (planSummary as { summary?: unknown }).summary;
    if (typeof summary === "string") {
      texts.push(summary);
    }
  }

  for (const text of texts) {
    if (isConversationalPlanningFiller(text)) {
      continue;
    }

    const parsed = tryParseToolJson(text);
    if (parsed) {
      const success = parsed.success;
      const exitCode = parsed.exit_code;
      if (success === true && (exitCode === 0 || exitCode === undefined)) {
        return true;
      }
      if (success === false) {
        continue;
      }
    }

    if (AUTOMATION_TERMINAL_MARKERS.some((marker) => marker.test(text))) {
      return true;
    }
  }

  return false;
}

export function enforceAutomationTerminalConfirmation(input: {
  readonly intent: TaskIntent;
  readonly agentResult: AgentResult;
  readonly planningResult?: AgentResult;
}): AgentResult {
  if (!requiresAutomationTerminalConfirmation(input.intent)) {
    return input.agentResult;
  }
  if (!input.agentResult.success) {
    return input.agentResult;
  }
  if (hasAutomationTerminalConfirmation(input.agentResult, input.planningResult)) {
    return input.agentResult;
  }

  const stderrHint = extractAutomationStderr(input.agentResult, input.planningResult);
  return {
    ...input.agentResult,
    success: false,
    error: {
      code: "AUTOMATION_TERMINAL_MISSING",
      message: stderrHint
        ? `Automation did not report terminal confirmation. ${stderrHint}`
        : "Automation did not report terminal confirmation — script output missing or only planning filler was returned.",
    },
  };
}

function extractAutomationStderr(
  agentResult: AgentResult,
  planningResult?: AgentResult,
): string | undefined {
  const texts: string[] = [];
  collectPayloadStrings(agentResult.payload, texts);
  collectPayloadStrings(planningResult?.payload, texts);

  for (const text of texts) {
    const parsed = tryParseToolJson(text);
    const stderr = parsed?.stderr;
    if (typeof stderr === "string" && stderr.trim().length > 0) {
      return stderr.trim().slice(0, 500);
    }
  }
  return undefined;
}
