/**
 * @jarvis/memory-service — Jarvis Memory Service (Phase 5 skeleton).
 * Owns persistent memory; Hermes uses memory APIs only.
 */

export {
  createMemoryService,
  createMemoryServiceWith,
  createStubMemoryComponents,
} from "./create-memory-service";

export type { MemoryApiService, MemoryServiceComponents } from "./memory-api";
export { MemoryApiServiceStub } from "./memory-api";
export * from "./memory-provider";
export * from "./retrieval-engine";
export * from "./embedding-provider";
export * from "./storage-adapter";

/** Memory service module identifiers for structure tests. */
export const MEMORY_SERVICE_MODULE_IDS = [
  "memory-provider",
  "retrieval-engine",
  "embedding-provider",
  "storage-adapter",
  "memory-api",
] as const;

export type MemoryServiceModuleId = (typeof MEMORY_SERVICE_MODULE_IDS)[number];
