/**
 * Desktop intent classifier adapter for orchestrator e2e (Phase 50).
 * Reuses apps/desktop intent rules — no duplicate classifier logic.
 */
export type {
  ChatIntentType,
  IntentClassification,
} from "../../../../apps/desktop/src/renderer/intent/intent-types";
export {
  classifyChatIntent,
  buildTaskIntentFromClassification,
  mapChatIntentToTaskKind,
} from "../../../../apps/desktop/src/renderer/intent/index";
