import type { TaskIntent } from "@jarvis/types";
import type { ChatIntentType, IntentClassification } from "./intent-types";
/**
 * API gateway allowed `intent.kind` values (Phase 6 validator).
 * Desktop does not change the API — maps chat intents into this set.
 */
export type TaskIntentKind = "automate" | "plan" | "research" | "draft" | "default";
/** Map desktop {@link ChatIntentType} → API `intent.kind` (Phase 24). */
export declare function mapChatIntentToTaskKind(intent: ChatIntentType): TaskIntentKind;
/**
 * Build {@link TaskIntent} for `POST /tasks` from classification + user text.
 */
export declare function buildTaskIntentFromClassification(message: string, classification: IntentClassification): TaskIntent;
//# sourceMappingURL=map-intent-to-task.d.ts.map