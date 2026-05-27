import { InMemoryTransportProvider } from "./in-memory-transport-provider";
import { LocalEventTransportProvider } from "./local-event-transport-provider";
import { TransportProviderRegistry } from "./transport-provider-registry";
import { TransportRuntime } from "./transport-runtime";

export interface CreateTransportRuntimeOptions {
  readonly localEventFilePath?: string;
  readonly defaultProviderId?: "in-memory" | "local-event";
}

/**
 * Default transport runtime — in-memory provider (Phase 52).
 */
export function createDefaultTransportRuntime(): TransportRuntime {
  const registry = new TransportProviderRegistry(new InMemoryTransportProvider());
  return new TransportRuntime(registry);
}

/**
 * Transport runtime with local event file persistence as default (Phase 52).
 */
export function createLocalEventTransportRuntime(
  filePath: string,
): TransportRuntime {
  const inMemory = new InMemoryTransportProvider();
  const registry = new TransportProviderRegistry(inMemory);
  const localProvider = new LocalEventTransportProvider(filePath);
  registry.register(localProvider);
  registry.setDefaultProvider(localProvider.providerId);
  return new TransportRuntime(registry);
}

/**
 * Configurable transport runtime factory (Phase 52).
 */
export function createTransportRuntime(
  options: CreateTransportRuntimeOptions = {},
): TransportRuntime {
  const inMemory = new InMemoryTransportProvider();
  const registry = new TransportProviderRegistry(inMemory);

  if (options.localEventFilePath) {
    registry.register(new LocalEventTransportProvider(options.localEventFilePath));
    registry.setDefaultProvider(
      options.defaultProviderId === "in-memory" ? "in-memory" : "local-event",
    );
  }

  return new TransportRuntime(registry);
}
