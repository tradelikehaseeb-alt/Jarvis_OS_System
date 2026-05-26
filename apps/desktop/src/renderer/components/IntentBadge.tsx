import type { ChatIntentType } from "../intent/intent-types";

export interface IntentBadgeProps {
  readonly intent: ChatIntentType;
  /** Optional short label override (defaults to intent name). */
  readonly label?: string;
}

const INTENT_LABELS: Record<ChatIntentType, string> = {
  plan: "Plan",
  research: "Research",
  automate: "Automate",
  search: "Search",
  conversation: "Conversation",
};

/**
 * Displays the detected chat intent before/after task submission (Phase 24).
 */
export function IntentBadge({ intent, label }: IntentBadgeProps) {
  const display = label ?? INTENT_LABELS[intent];

  return (
    <span
      className={`intent-badge intent-${intent}`}
      data-testid="intent-badge"
      data-intent={intent}
      title={`Detected intent: ${intent}`}
    >
      {display}
    </span>
  );
}
