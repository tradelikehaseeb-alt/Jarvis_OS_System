import type { TaskIntent } from "../contracts/task-intent";

import type { ChatIntentType, IntentClassification } from "./intent-types";

export type TaskIntentKind = "automate" | "plan" | "research" | "draft" | "default";

export function mapChatIntentToTaskKind(intent: ChatIntentType): TaskIntentKind {
  switch (intent) {
    case "plan":
      return "plan";
    case "research":
      return "research";
    case "automate":
      return "automate";
    case "search":
      return "research";
    case "conversation":
      return "default";
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

export function buildTaskIntentFromClassification(
  message: string,
  classification: IntentClassification,
): TaskIntent {
  const description = message.trim();
  return {
    kind: mapChatIntentToTaskKind(classification.intent),
    description,
    parameters: {
      classifiedIntent: classification.intent,
      classificationRule: classification.ruleId,
      classificationConfidence: classification.confidence,
    },
  };
}
