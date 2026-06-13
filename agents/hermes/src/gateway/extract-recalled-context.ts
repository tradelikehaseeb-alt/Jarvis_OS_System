import type { AgentContext } from "@jarvis/agents-shared";

/** Single turn passed to Hermes for multi-turn chat. */
export interface HermesConversationTurn {
  readonly role: "user" | "assistant" | "system";
  readonly message: string;
}

/** User-facing recalled context passed to Hermes planning (Phase 93). */
export interface HermesRecalledContext {
  readonly count: number;
  readonly snippets: readonly string[];
  readonly turns: readonly HermesConversationTurn[];
}

const MAX_RECALL_TURNS = 10;

function readConversationMessages(
  metadata: Readonly<Record<string, unknown>> | undefined,
): readonly HermesConversationTurn[] {
  const raw = metadata?.conversationMessages;
  if (!Array.isArray(raw)) {
    return [];
  }

  const turns: HermesConversationTurn[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const role = (entry as { role?: unknown }).role;
    const message = (entry as { message?: unknown }).message;
    if (
      (role === "user" || role === "assistant" || role === "system") &&
      typeof message === "string" &&
      message.trim().length > 0
    ) {
      turns.push({ role, message: message.trim() });
    }
  }
  return turns;
}

function turnsFromMemoryRecall(
  recall: unknown,
): readonly HermesConversationTurn[] {
  if (!Array.isArray(recall)) {
    return [];
  }

  return recall
    .filter(
      (entry): entry is { content: string; source: string; role?: string } =>
        typeof entry === "object" &&
        entry !== null &&
        "content" in entry &&
        "source" in entry &&
        (entry as { source: string }).source === "conversation-history" &&
        typeof (entry as { content: string }).content === "string",
    )
    .map((entry) => ({
      role:
        entry.role === "assistant" || entry.role === "system"
          ? entry.role
          : ("user" as const),
      message: entry.content.trim(),
    }));
}

function formatSnippet(turn: HermesConversationTurn): string {
  return `${turn.role}: ${turn.message}`;
}

/**
 * Extracts recalled context from orchestrator agent metadata (Phase 93).
 */
export function extractRecalledContextFromAgentContext(
  context: AgentContext,
): HermesRecalledContext | undefined {
  const metadata = context.metadata;
  const fromMessages = readConversationMessages(metadata);
  const fromRecall = turnsFromMemoryRecall(metadata?.jarvisMemoryRecall);

  const merged: HermesConversationTurn[] = [];
  const seen = new Set<string>();

  for (const turn of [...fromRecall, ...fromMessages]) {
    const key = `${turn.role}:${turn.message}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(turn);
  }

  const turns = merged.slice(-MAX_RECALL_TURNS);
  if (turns.length === 0) {
    return undefined;
  }

  return {
    count: turns.length,
    snippets: turns.map(formatSnippet),
    turns,
  };
}
