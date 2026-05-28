export interface ContextSignal {
  readonly signalId: string;
  readonly topic: string;
  readonly relevance: number;
  readonly userLabel: string;
}

export interface ContextAwarenessSnapshot {
  readonly userId: string;
  readonly conversationId?: string;
  readonly signals: readonly ContextSignal[];
  readonly dailyContinuity: boolean;
  readonly updatedAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Proactive context awareness for continuous assistance (Phase 99).
 */
export class ContextAwarenessRuntime {
  evaluate(description: string, userId: string, conversationId?: string): ContextAwarenessSnapshot {
    const signals: ContextSignal[] = [];

    if (/\b(gold|market|trading|bitcoin|stock)\b/i.test(description)) {
      signals.push({
        signalId: nextId("ctx"),
        topic: "market",
        relevance: 0.9,
        userLabel: "Monitoring market…",
      });
    }
    if (/\b(ai news|news|briefing|updates)\b/i.test(description)) {
      signals.push({
        signalId: nextId("ctx"),
        topic: "news",
        relevance: 0.85,
        userLabel: "Watching for updates…",
      });
    }
    if (/\b(task|workflow|complete|remind)\b/i.test(description)) {
      signals.push({
        signalId: nextId("ctx"),
        topic: "workflow",
        relevance: 0.8,
        userLabel: "Tracking workflow…",
      });
    }
    if (/\b(morning|daily|every day|briefing)\b/i.test(description)) {
      signals.push({
        signalId: nextId("ctx"),
        topic: "schedule",
        relevance: 0.75,
        userLabel: "Preparing briefing…",
      });
    }

    return {
      userId,
      conversationId,
      signals,
      dailyContinuity: /\b(daily|morning|every|continue)\b/i.test(description),
      updatedAt: nowIso(),
    };
  }
}

export function createDefaultContextAwarenessRuntime(): ContextAwarenessRuntime {
  return new ContextAwarenessRuntime();
}
