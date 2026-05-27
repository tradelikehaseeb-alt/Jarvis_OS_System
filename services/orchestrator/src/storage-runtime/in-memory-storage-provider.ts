import type { StorageHealth } from "./storage-health";
import type { StorageQuery } from "./storage-query";
import type { StorageProvider } from "./storage-provider";
import type { StorageRecord } from "./storage-record";

function recordKey(namespace: string, id: string): string {
  return `${namespace}:${id}`;
}

function matchesFilter(
  record: StorageRecord,
  filter: Readonly<Record<string, unknown>>,
): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (key === "id") {
      if (record.id !== value) {
        return false;
      }
      continue;
    }

    const metadataValue = record.metadata?.[key];
    const dataValue = record.data[key];

    if (metadataValue !== undefined) {
      if (metadataValue !== value) {
        return false;
      }
      continue;
    }

    if (dataValue !== value) {
      return false;
    }
  }

  return true;
}

function sortRecords(
  records: StorageRecord[],
  sort: StorageQuery["sort"],
): StorageRecord[] {
  const direction = sort ?? "asc";
  return records.sort((a, b) => {
    const cmp = a.timestamp.localeCompare(b.timestamp);
    return direction === "asc" ? cmp : -cmp;
  });
}

/**
 * Deterministic in-memory storage provider (Phase 51).
 */
export class InMemoryStorageProvider implements StorageProvider {
  readonly providerId = "in-memory" as const;

  private readonly records = new Map<string, StorageRecord>();

  save(record: StorageRecord): StorageRecord {
    this.records.set(recordKey(record.namespace, record.id), record);
    return record;
  }

  get(id: string, namespace: string): StorageRecord | undefined {
    return this.records.get(recordKey(namespace, id));
  }

  query(query: StorageQuery): readonly StorageRecord[] {
    let results = [...this.records.values()];

    if (query.namespace) {
      results = results.filter((record) => record.namespace === query.namespace);
    }

    if (query.filter) {
      results = results.filter((record) => matchesFilter(record, query.filter!));
    }

    results = sortRecords(results, query.sort);

    if (query.limit !== undefined) {
      return results.slice(-query.limit);
    }

    return results;
  }

  delete(id: string, namespace: string): boolean {
    return this.records.delete(recordKey(namespace, id));
  }

  getHealth(): StorageHealth {
    return {
      providerId: this.providerId,
      status: "healthy",
      recordCount: this.records.size,
      checkedAt: new Date().toISOString(),
    };
  }

  /** Test helper — count of stored records. */
  size(): number {
    return this.records.size;
  }
}
