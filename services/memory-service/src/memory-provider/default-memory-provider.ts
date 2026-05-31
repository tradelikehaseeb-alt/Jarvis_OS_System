import type {
  MemoryQuery,
  MemoryRecord,
  MemorySearchResult,
  MemoryStoreInput,
} from "@jarvis/types";

import type { EmbeddingProvider } from "../embedding-provider/contract";
import { TfidfEmbeddingProvider } from "../embedding-provider/tfidf-embedding-provider";
import { SqliteStorageAdapter } from "../storage-adapter/sqlite-storage-adapter";
import type { MemoryCategory } from "../storage-adapter/sqlite-schema";
import type { MemoryProviderComponent } from "./contract";

function parseCategory(metadata?: Readonly<Record<string, unknown>>): MemoryCategory {
  const raw = metadata?.category ?? metadata?.type;
  if (
    raw === "conversation" ||
    raw === "fact" ||
    raw === "task" ||
    raw === "reminder"
  ) {
    return raw;
  }
  return "fact";
}

/**
 * Real memory provider — SQLite persistence with category + importance metadata.
 */
export class DefaultMemoryProvider implements MemoryProviderComponent {
  readonly componentId = "memory-provider" as const;

  constructor(
    private readonly storage: SqliteStorageAdapter,
    private readonly embeddings: EmbeddingProvider,
  ) {}

  async store(input: MemoryStoreInput): Promise<MemoryRecord> {
    await this.embeddings.embed(input.content);
    const category = parseCategory(input.metadata);
    const importance =
      typeof input.metadata?.importance === "number"
        ? input.metadata.importance
        : 0.5;

    const row = await this.storage.saveMemory({
      userId: input.userId,
      content: input.content,
      category,
      importance,
    });

    return {
      id: row.id,
      userId: row.userId,
      content: row.content,
      createdAt: row.timestamp,
      metadata: {
        category: row.category,
        importance: row.importance,
        ...input.metadata,
      },
      embeddingRef: input.embeddingRef ?? `emb-${row.id}`,
    };
  }

  async get(recordId: string, userId: string): Promise<MemoryRecord | undefined> {
    return this.storage.load(recordId, userId);
  }

  async search(query: MemoryQuery): Promise<readonly MemorySearchResult[]> {
    const limit = query.limit ?? 10;
    const ftsHits = await this.storage.searchMemories(
      query.userId,
      query.query,
      limit,
    );

    const tfidf =
      this.embeddings instanceof TfidfEmbeddingProvider
        ? this.embeddings.scoreDocuments(
            query.query,
            ftsHits.map((hit) => ({
              id: hit.memory.id,
              text: hit.memory.content,
            })),
          )
        : [];

    const tfidfById = new Map(tfidf.map((entry) => [entry.id, entry.score]));

    return ftsHits.map((hit) => {
      const tfidfScore = tfidfById.get(hit.memory.id) ?? 0;
      const combined = hit.score * 0.65 + tfidfScore * 0.35;
      const record: MemoryRecord = {
        id: hit.memory.id,
        userId: hit.memory.userId,
        content: hit.memory.content,
        createdAt: hit.memory.timestamp,
        metadata: {
          category: hit.memory.category,
          importance: hit.memory.importance,
        },
        embeddingRef: `emb-${hit.memory.id}`,
      };
      return { record, score: combined };
    });
  }

  /** Saves memory with explicit category (convenience API). */
  async saveMemory(
    userId: string,
    content: string,
    category: MemoryCategory,
    importance = 0.5,
  ): Promise<MemoryRecord> {
    return this.store({
      userId,
      content,
      metadata: { category, importance },
    });
  }

  async listMemories(
    userId: string,
    category?: MemoryCategory,
    limit = 50,
  ): Promise<readonly MemoryRecord[]> {
    const rows = await this.storage.listMemories(userId, category, limit);
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      content: row.content,
      createdAt: row.timestamp,
      metadata: { category: row.category, importance: row.importance },
      embeddingRef: `emb-${row.id}`,
    }));
  }

  async deleteMemory(recordId: string, userId: string): Promise<boolean> {
    return this.storage.remove(recordId, userId);
  }
}
