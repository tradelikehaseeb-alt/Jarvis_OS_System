import type { TaskStatusResponse } from "../api/task-status-response";

import {
  looksLikeRawApiError,
  stripProviderDecoration,
} from "./sanitize-assistant-reply";

const CONVERSATIONAL_INTENT_KINDS = new Set([
  "default",
  "chat",
  "conversation",
]);

const NUMBERED_PLAN_LINE = /^\s*\d+[\).\s]/;

function readRecord(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return value !== null && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

/** Internal orchestrator memory digest — never show as chat reply. */
function isInternalMemoryDigest(text: string): boolean {
  return /^Memory summary for user /i.test(text.trim());
}

function looksLikeNumberedPlan(text: string): boolean {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return false;
  }
  const numbered = lines.filter((line) => NUMBERED_PLAN_LINE.test(line));
  return numbered.length >= Math.max(2, Math.ceil(lines.length * 0.5));
}

function stripHermesReasoningPrefix(summary: string): string {
  const marker = " — ";
  const index = summary.indexOf(marker);
  if (index >= 0) {
    return summary.slice(index + marker.length).trim();
  }
  return summary.trim();
}

/**
 * Resolve the user-visible assistant reply from task output.
 * Prefers Hermes conversational text over orchestrator LLM plan output.
 */
export function resolveAssistantReplyFromTaskOutput(
  output: Readonly<Record<string, unknown>> | undefined,
): string | undefined {
  if (!output) {
    return undefined;
  }

  const agentPayload = readRecord(output.agentPayload);
  const conversationalReply = readString(agentPayload?.conversationalReply);
  if (conversationalReply && !looksLikeRawApiError(conversationalReply)) {
    return stripProviderDecoration(conversationalReply);
  }

  const plan = readRecord(agentPayload?.plan);
  const intentKind = readString(plan?.intentKind)?.toLowerCase();
  const planSummary = readString(plan?.summary);
  if (
    planSummary &&
    intentKind &&
    CONVERSATIONAL_INTENT_KINDS.has(intentKind) &&
    !looksLikeNumberedPlan(planSummary) &&
    !looksLikeRawApiError(planSummary)
  ) {
    return stripProviderDecoration(planSummary);
  }

  const reasoning = readRecord(agentPayload?.reasoning);
  const reasoningSummary = readString(reasoning?.summary);
  if (reasoningSummary) {
    const stripped = stripProviderDecoration(
      stripHermesReasoningPrefix(reasoningSummary),
    );
    if (
      stripped &&
      !looksLikeNumberedPlan(stripped) &&
      !looksLikeRawApiError(stripped)
    ) {
      return stripped;
    }
  }

  const assistantReply = readString(output.assistantReply);
  if (
    assistantReply &&
    !looksLikeNumberedPlan(assistantReply) &&
    !isInternalMemoryDigest(assistantReply) &&
    !looksLikeRawApiError(assistantReply)
  ) {
    return stripProviderDecoration(assistantReply);
  }

  const llmProvider = readRecord(output.llmProvider);
  const preview = readString(llmProvider?.contentPreview);
  if (preview && llmProvider?.success !== false && !looksLikeNumberedPlan(preview)) {
    return preview;
  }

  if (assistantReply) {
    return assistantReply;
  }

  return preview;
}

/** Convenience wrapper for {@link TaskStatusResponse}. */
export function resolveAssistantReplyFromTaskStatus(
  status: TaskStatusResponse,
): string | undefined {
  return resolveAssistantReplyFromTaskOutput(status.output);
}
