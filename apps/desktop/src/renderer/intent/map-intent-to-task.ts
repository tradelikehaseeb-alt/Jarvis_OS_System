import type { TaskIntent } from "@jarvis/types";

import type { ChatIntentType, IntentClassification } from "./intent-types";

/**
 * API gateway allowed `intent.kind` values (Phase 6 validator).
 * Desktop does not change the API — maps chat intents into this set.
 */
export type TaskIntentKind = "automate" | "plan" | "research" | "draft" | "default";

/** Map desktop {@link ChatIntentType} → API `intent.kind` (Phase 24). */
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

/**
 * Build {@link TaskIntent} for `POST /tasks` from classification + user text.
 */
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
