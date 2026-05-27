import type { ContextQuery } from "./context-query";
import type { ContextRecord } from "./context-record";
import type { ContextScore } from "./context-score";
import type { ContextRelevanceRule } from "./context-relevance-rule";
import type { ContextScorer } from "./context-scorer";
import { DEFAULT_CONTEXT_RELEVANCE_RULES } from "./default-context-relevance-rules";

/**
 * Default context scorer using weighted relevance rules (Phase 65).
 */
export class DefaultContextScorer implements ContextScorer {
  constructor(
    private readonly rules: readonly ContextRelevanceRule[] = DEFAULT_CONTEXT_RELEVANCE_RULES,
  ) {}

  scoreContext(
    query: ContextQuery,
    record: ContextRecord,
  ): readonly ContextScore[] {
    return record.turns.map((turn, turnIndex) => {
      let score = 0;
      const reasons: string[] = [];

      for (const rule of this.rules) {
        const ruleValue = rule.apply(
          query,
          turn,
          turnIndex,
          record.turns.length,
        );
        if (ruleValue > 0) {
          score += ruleValue * rule.weight;
          reasons.push(`${rule.ruleId}:${ruleValue.toFixed(2)}`);
        }
      }

      return {
        turnIndex,
        score,
        reason: reasons.length > 0 ? reasons.join(", ") : "no-match",
        turn,
      };
    });
  }
}
