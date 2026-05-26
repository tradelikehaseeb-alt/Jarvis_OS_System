/** Deterministic mock ids for memory service stubs (Phase 5). */

export const MOCK_MEMORY_TIMESTAMP = "2026-01-01T00:00:00.000Z";

let memoryIdSequence = 0;

export function mockMemoryId(userId: string): string {
  memoryIdSequence += 1;
  return `mem-stub-${userId}-${memoryIdSequence}`;
}

/** Reset sequence for deterministic tests. */
export function resetMockMemoryIdSequence(): void {
  memoryIdSequence = 0;
}

export function mockEmbeddingRef(recordId: string): string {
  return `emb-ref-stub-${recordId}`;
}

/** Static stub embedding vector — not a real model output. */
export const STUB_EMBEDDING_VECTOR: readonly number[] = [0, 0, 0] as const;
