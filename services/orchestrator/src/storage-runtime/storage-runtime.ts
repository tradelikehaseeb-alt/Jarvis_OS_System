import type { StorageHealth } from "./storage-health";
import type { StorageQuery } from "./storage-query";
import type { StorageRecord } from "./storage-record";
import type { StorageProviderRegistry } from "./storage-provider-registry";

/**
 * Orchestrator storage runtime facade (Phase 51).
 *
 * Memory persistence and future modules route through this boundary.
 */
export class StorageRuntime {
  constructor(private readonly registry: StorageProviderRegistry) {}

  save(record: StorageRecord, providerId?: string): StorageRecord {
    return this.registry.resolve(providerId).save(record);
  }

  get(
    id: string,
    namespace: string,
    providerId?: string,
  ): StorageRecord | undefined {
    return this.registry.resolve(providerId).get(id, namespace);
  }

  query(query: StorageQuery, providerId?: string): readonly StorageRecord[] {
    return this.registry.resolve(providerId).query(query);
  }

  delete(id: string, namespace: string, providerId?: string): boolean {
    return this.registry.resolve(providerId).delete(id, namespace);
  }

  getHealth(providerId?: string): StorageHealth {
    return this.registry.getHealth(providerId);
  }

  getDefaultProviderId(): string {
    return this.registry.getDefaultProviderId();
  }

  listProviderIds(): readonly string[] {
    return this.registry.listProviderIds();
  }
}
