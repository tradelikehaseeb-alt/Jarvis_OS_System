/**
 * Registered provider connection entry (Phase 60).
 */
export interface ProviderRegistryEntry {
  readonly providerId: string;
  readonly family: "hermes" | "openclaw";
  readonly label: string;
  readonly stub: boolean;
  readonly endpoint?: string;
}

/**
 * Registry of connectable providers for provider-runtime (Phase 60).
 */
export interface ProviderRegistry {
  register(entry: ProviderRegistryEntry): void;
  resolve(providerId: string): ProviderRegistryEntry | undefined;
  list(): readonly ProviderRegistryEntry[];
}

/**
 * In-memory provider connection registry (Phase 60).
 */
export class InMemoryProviderRegistry implements ProviderRegistry {
  private readonly entries = new Map<string, ProviderRegistryEntry>();

  register(entry: ProviderRegistryEntry): void {
    this.entries.set(entry.providerId, entry);
  }

  resolve(providerId: string): ProviderRegistryEntry | undefined {
    return this.entries.get(providerId);
  }

  list(): readonly ProviderRegistryEntry[] {
    return [...this.entries.values()];
  }
}
