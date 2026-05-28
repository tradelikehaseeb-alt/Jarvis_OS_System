import type { SessionMemoryProfile } from "@jarvis/local-memory";

import type { ContextQuery } from "../context/context-query";
import type { ContextRecord } from "../context/context-record";
import type { ContextScore } from "../context/context-score";
import type { ContextScorer } from "../context/context-scorer";
import { DefaultContextScorer } from "../context/default-context-scorer";
import type { ConversationContinuityRuntime } from "./conversation-continuity-runtime";

/**
 * Applies adaptive recall weight multipliers from {@link SessionMemoryProfile} (Phase 93).
 */
export class AdaptiveContextScorer implements ContextScorer {
  constructor(
    private readonly inner: ContextScorer = new DefaultContextScorer(),
    private readonly continuityRuntime?: ConversationContinuityRuntime,
  ) {}

  scoreContext(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[] {
    const profile = this.continuityRuntime?.getProfile(
      query.userId,
      query.conversationId,
    );
    const base = this.inner.scoreContext(query, record);
    const weights = profile?.recallWeights ?? {};

    return base.map((entry) => {
      let multiplier = 1;
      for (const token of entry.reason.split(", ")) {
        const ruleId = token.split(":")[0];
        if (ruleId && weights[ruleId]) {
          multiplier = Math.max(multiplier, weights[ruleId]!);
        }
      }

      const topicBoost =
        profile?.topicKeywords.some((keyword) =>
          entry.turn.message.toLowerCase().includes(keyword.toLowerCase()),
        ) ?? false;

      const continuityBoost =
        profile?.recentInteractionIds.includes(entry.turn.taskId ?? "") ??
        false;

      let score = entry.score * multiplier;
      if (topicBoost) {
        score *= 1.15;
      }
      if (continuityBoost) {
        score *= 1.2;
      }

      return {
        ...entry,
        score,
        reason: `${entry.reason}${topicBoost ? ", topic-boost" : ""}${continuityBoost ? ", continuity-boost" : ""}`,
      };
    });
  }
}
