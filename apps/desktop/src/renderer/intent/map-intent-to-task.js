/** Map desktop {@link ChatIntentType} → API `intent.kind` (Phase 24). */
export function mapChatIntentToTaskKind(intent) {
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
            const _exhaustive = intent;
            return _exhaustive;
        }
    }
}
/**
 * Build {@link TaskIntent} for `POST /tasks` from classification + user text.
 */
export function buildTaskIntentFromClassification(message, classification) {
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
