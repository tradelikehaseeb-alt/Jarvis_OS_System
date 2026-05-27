import { FileStorageProvider } from "./file-storage-provider";
import { InMemoryStorageProvider } from "./in-memory-storage-provider";
import { StorageProviderRegistry } from "./storage-provider-registry";
import { StorageRuntime } from "./storage-runtime";

export interface CreateStorageRuntimeOptions {
  readonly filePath?: string;
  readonly defaultProviderId?: "in-memory" | "file";
}

/**
 * Default storage runtime — in-memory provider (Phase 51).
 */
export function createDefaultStorageRuntime(): StorageRuntime {
  const registry = new StorageProviderRegistry(new InMemoryStorageProvider());
  return new StorageRuntime(registry);
}

/**
 * Storage runtime with file-backed default provider (Phase 51).
 */
export function createFileStorageRuntime(filePath: string): StorageRuntime {
  const inMemory = new InMemoryStorageProvider();
  const registry = new StorageProviderRegistry(inMemory);
  const fileProvider = new FileStorageProvider(filePath);
  registry.register(fileProvider);
  registry.setDefaultProvider(fileProvider.providerId);
  return new StorageRuntime(registry);
}

/**
 * Configurable storage runtime factory (Phase 51).
 */
export function createStorageRuntime(
  options: CreateStorageRuntimeOptions = {},
): StorageRuntime {
  const inMemory = new InMemoryStorageProvider();
  const registry = new StorageProviderRegistry(inMemory);

  if (options.filePath) {
    registry.register(new FileStorageProvider(options.filePath));
    registry.setDefaultProvider(
      options.defaultProviderId === "in-memory" ? "in-memory" : "file",
    );
  }

  return new StorageRuntime(registry);
}
