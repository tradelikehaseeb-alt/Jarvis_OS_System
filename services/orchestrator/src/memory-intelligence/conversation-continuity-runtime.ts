import type { LocalMemoryRuntime } from "@jarvis/local-memory";
import {
  getSessionMemoryProfile,
  resolveSessionMemoryProfile,
  saveSessionMemoryProfile,
  type SessionMemoryProfile,
} from "@jarvis/local-memory";

import { extractKeywords } from "../shared/history-utils";

export interface ContinuityTurnInput {
  readonly userId: string;
  readonly conversationId: string;
  readonly taskId?: string;
  readonly message: string;
  readonly priorConversationIds?: readonly string[];
}

/**
 * Maintains multi-session conversational continuity (Phase 93).
 */
export class ConversationContinuityRuntime {
  private readonly conversationLinks = new Map<string, readonly string[]>();

  constructor(private readonly localMemoryRuntime?: LocalMemoryRuntime) {}

  registerTurn(input: ContinuityTurnInput): SessionMemoryProfile {
    const prior = input.priorConversationIds ?? [];
    if (prior.length > 0) {
      this.conversationLinks.set(input.conversationId, prior);
    }

    const runtime = this.localMemoryRuntime;
    const profile = runtime
      ? resolveSessionMemoryProfile(runtime, input.userId, input.conversationId)
      : {
          profileId: `profile-${input.userId}-${input.conversationId}`,
          userId: input.userId,
          conversationId: input.conversationId,
          recentInteractionIds: [],
          topicKeywords: [],
          recallWeights: { "semantic-relevance": 1.1, recency: 1.05 },
          updatedAt: new Date().toISOString(),
        };

    const keywords = extractKeywords(input.message);
    const mergedKeywords = [
      ...new Set([...profile.topicKeywords, ...keywords].slice(-12)),
    ];
    const recentIds = [
      input.taskId,
      ...profile.recentInteractionIds.filter((id) => id !== input.taskId),
    ]
      .filter((id): id is string => Boolean(id))
      .slice(0, 8);

    const updated: SessionMemoryProfile = {
      ...profile,
      recentInteractionIds: recentIds,
      topicKeywords: mergedKeywords,
      updatedAt: new Date().toISOString(),
    };

    if (runtime) {
      saveSessionMemoryProfile(runtime, updated);
    }

    return updated;
  }

  getLinkedConversations(conversationId: string): readonly string[] {
    return this.conversationLinks.get(conversationId) ?? [];
  }

  getProfile(userId: string, conversationId?: string): SessionMemoryProfile | undefined {
    if (!this.localMemoryRuntime) {
      return undefined;
    }
    return getSessionMemoryProfile(
      this.localMemoryRuntime,
      userId,
      conversationId,
    );
  }
}
