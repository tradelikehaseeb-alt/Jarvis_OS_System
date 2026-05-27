/**
 * Desktop intent classifier adapter for orchestrator e2e (Phase 50).
 * Reuses apps/desktop intent rules — no duplicate classifier logic.
 */
export type {
  ChatIntentType,
  IntentClassification,
} from "@jarvis/desktop-intent";
export {
  classifyChatIntent,
  buildTaskIntentFromClassification,
  mapChatIntentToTaskKind,
} from "@jarvis/desktop-intent";
