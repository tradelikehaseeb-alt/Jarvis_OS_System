import {
  getHermesExecutionMode,
  getHermesSkillCategory,
  resolveHermesUserStatusMessage,
} from "@jarvis/types";

import { ACTIVITY_EVENT_LABELS } from "../activity/activity-event";

/** User-facing execution copy — never exposes internal agent/runtime names (Phase 89). */
export const JARVIS_EXECUTION_LABELS = {
  idle: "Ready",
  thinking: "Jarvis is thinking…",
  understanding: "Understanding request",
  understandingActive: "Understanding request…",
  understandingComplete: "Request understood",
  performing: "Performing task",
  performingActive: "Performing task…",
  performingComplete: "Task complete",
  performingWaiting: "Preparing next step…",
  memoryUpdating: "Updating memory…",
  memorySaved: "Memory updated",
  streaming: "Generating response…",
  demoLive: "Live demo in progress",
  demoVoice: "Voice command received",
  completed: "Done",
  taskComplete: "All set",
  workforceCoordinating: "Coordinating tasks…",
  workforceResearching: "Researching…",
  workforceAnalyzing: "Analyzing…",
  workforcePreparingSummary: "Preparing summary…",
  workforceCompleted: "Completed.",
  productivityReviewingEmails: "Reviewing emails…",
  productivityOrganizing: "Organizing priorities…",
  productivityScheduling: "Scheduling…",
  productivitySummarizing: "Summarizing…",
  productivityCompleted: "Completed.",
  realWorldPerforming: "Performing task…",
  realWorldResearching: "Researching…",
  realWorldRecovering: "Recovering connection…",
  realWorldCompleted: "Completed.",
  inProgress: "Working",
  failed: "Something went wrong",
  ready: "Jarvis is ready",
  sendPrompt: "Ask Jarvis anything…",
  planBadge: "Jarvis",
  planLabel: "Action plan",
} as const;

export const JARVIS_ACTIVITY_LABELS = ACTIVITY_EVENT_LABELS;

export function loadingMessageForJarvisIntent(
  intent: string,
  query?: string,
): string {
  if (query?.trim()) {
    const mode = getHermesExecutionMode(query);
    if (mode === "skills") {
      return resolveHermesUserStatusMessage(getHermesSkillCategory(query));
    }
    return JARVIS_EXECUTION_LABELS.thinking;
  }

  if (intent === "plan") {
    return JARVIS_EXECUTION_LABELS.understandingActive;
  }
  if (intent === "automate") {
    return JARVIS_EXECUTION_LABELS.performingActive;
  }
  if (intent === "search" || intent === "research") {
    return JARVIS_EXECUTION_LABELS.workforceResearching;
  }
  return JARVIS_EXECUTION_LABELS.thinking;
}

export function formatJarvisTaskReply(status: string): string {
  return status === "completed"
    ? JARVIS_EXECUTION_LABELS.completed
    : `Status: ${status}`;
}
