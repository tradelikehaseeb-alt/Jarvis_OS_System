import type { MemorySearchResult, RetrievalRequest, RetrievalResponse } from "@jarvis/types";

import { TfidfEmbeddingProvider } from "../embedding-provider/tfidf-embedding-provider";
import type { EmbeddingProvider } from "../embedding-provider/contract";
import type { ConversationRow } from "../storage-adapter/memory-row-types";
import type { JarvisPersistentStorage } from "../storage-adapter/jarvis-persistent-storage";
import type { RetrievalEngine } from "./contract";

/**
 * FTS5 + TF-IDF retrieval with recency/importance ranking.
 */
export class DefaultRetrievalEngine implements RetrievalEngine {
  readonly componentId = "retrieval-engine" as const;

  constructor(
    private readonly storage: JarvisPersistentStorage,
    private readonly embeddings: EmbeddingProvider,
  ) {}

  async retrieve(request: RetrievalRequest): Promise<RetrievalResponse> {
    const results = await this.searchMemories(
      request.userId,
      request.query,
      request.topK ?? 10,
    );
    return {
      requestId: request.requestId,
      results,
    };
  }

  async searchMemories(
    userId: string,
    query: string,
    limit = 10,
  ): Promise<readonly MemorySearchResult[]> {
    const hits = await this.storage.searchMemories(userId, query, limit);
    const tfidf =
      this.embeddings instanceof TfidfEmbeddingProvider
        ? this.embeddings.scoreDocuments(
            query,
            hits.map((hit) => ({
              id: hit.memory.id,
              text: hit.memory.content,
            })),
          )
        : [];

    const tfidfById = new Map(tfidf.map((entry) => [entry.id, entry.score]));

    return hits.map((hit) => ({
      record: {
        id: hit.memory.id,
        userId: hit.memory.userId,
        content: hit.memory.content,
        createdAt: hit.memory.timestamp,
        metadata: {
          category: hit.memory.category,
          importance: hit.memory.importance,
        },
        embeddingRef: `emb-${hit.memory.id}`,
      },
      score: hit.score * 0.7 + (tfidfById.get(hit.memory.id) ?? 0) * 0.3,
    }));
  }

  async getRecentConversations(
    userId: string,
    limit = 10,
  ): Promise<readonly ConversationRow[]> {
    return this.storage.getRecentConversations(userId, limit);
  }

  async getUserFact(userId: string, key: string): Promise<string | undefined> {
    return this.storage.getUserFact(userId, key);
  }
}
