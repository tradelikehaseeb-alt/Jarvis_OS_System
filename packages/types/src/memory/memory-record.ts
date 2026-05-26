/**
 * Persistent memory unit owned by Jarvis Memory Service.
 * Hermes must access via memory APIs — never store this shape locally.
 */
export interface MemoryRecord {
  readonly id: string;
  readonly userId: string;
  /** Stored memory content (text or serialized payload reference). */
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  /** Optional tags, source, confidence — no secrets. */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Opaque handle to embedding row (no vector payload in Phase 5). */
  readonly embeddingRef?: string;
}
