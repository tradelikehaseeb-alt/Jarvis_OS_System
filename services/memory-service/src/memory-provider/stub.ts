import type {
  MemoryQuery,
  MemoryRecord,
  MemorySearchResult,
  MemoryStoreInput,
} from "@jarvis/types";

import {
  MOCK_MEMORY_TIMESTAMP,
  mockEmbeddingRef,
  mockMemoryId,
} from "../internal/mock-ids";
import type { EmbeddingProvider } from "../embedding-provider/contract";
import type { StorageAdapter } from "../storage-adapter/contract";
import type { MemoryProviderComponent } from "./contract";

const STUB_SEARCH_SCORE = 0.75;

/**
 * {@link MemoryProvider} stub — in-memory storage only (Phase 5).
 */
export class MemoryProviderStub implements MemoryProviderComponent {
  readonly componentId = "memory-provider" as const;

  constructor(
    private readonly storage: StorageAdapter,
    private readonly embeddings: EmbeddingProvider,
  ) {}

  async store(input: MemoryStoreInput): Promise<MemoryRecord> {
    void (await this.embeddings.embed(input.content));
    const id = mockMemoryId(input.userId);
    const record: MemoryRecord = {
      id,
      userId: input.userId,
      content: input.content,
      createdAt: MOCK_MEMORY_TIMESTAMP,
      metadata: input.metadata,
      embeddingRef: input.embeddingRef ?? mockEmbeddingRef(id),
    };
    return this.storage.save(record);
  }

  async get(recordId: string, userId: string): Promise<MemoryRecord | undefined> {
    return this.storage.load(recordId, userId);
  }

  async search(query: MemoryQuery): Promise<readonly MemorySearchResult[]> {
    const records = await this.storage.listByUserId(query.userId);
    const limit = query.limit ?? 10;
    return records.slice(0, limit).map((record) => ({
      record,
      score: STUB_SEARCH_SCORE,
    }));
  }
}
