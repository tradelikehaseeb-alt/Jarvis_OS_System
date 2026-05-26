import type { MemoryProvider } from "@jarvis/types";

/**
 * Memory provider component — implements {@link MemoryProvider} (Phase 5 stub).
 */
export interface MemoryProviderComponent extends MemoryProvider {
  readonly componentId: "memory-provider";
}
