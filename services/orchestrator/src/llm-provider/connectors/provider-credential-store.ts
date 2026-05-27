import type { StorageRecord } from "../../storage-runtime/storage-record";
import type { StorageRuntime } from "../../storage-runtime/storage-runtime";

import {
  PROVIDER_CREDENTIALS_NAMESPACE,
  type ProviderSettings,
} from "./provider-settings-types";

/** Credential persistence boundary — keys never leave this store in public APIs (Phase 83). */
export interface ProviderCredentialStore {
  saveApiKey(userId: string, providerId: string, apiKey: string): void;
  getApiKey(userId: string, providerId: string): string | undefined;
  deleteApiKey(userId: string, providerId: string): boolean;
  hasApiKey(userId: string, providerId: string): boolean;
  listConfiguredProviderIds(userId: string): readonly string[];
}

function credentialRecordId(userId: string, providerId: string): string {
  return `${userId}:${providerId}`;
}

/** In-memory credential store for tests (Phase 83). */
export class InMemoryProviderCredentialStore implements ProviderCredentialStore {
  private readonly keys = new Map<string, string>();

  saveApiKey(userId: string, providerId: string, apiKey: string): void {
    this.keys.set(credentialRecordId(userId, providerId), apiKey.trim());
  }

  getApiKey(userId: string, providerId: string): string | undefined {
    return this.keys.get(credentialRecordId(userId, providerId));
  }

  deleteApiKey(userId: string, providerId: string): boolean {
    return this.keys.delete(credentialRecordId(userId, providerId));
  }

  hasApiKey(userId: string, providerId: string): boolean {
    return this.keys.has(credentialRecordId(userId, providerId));
  }

  listConfiguredProviderIds(userId: string): readonly string[] {
    const prefix = `${userId}:`;
    return [...this.keys.keys()]
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
  }
}

function toCredentialRecord(
  userId: string,
  providerId: string,
  apiKey: string,
): StorageRecord {
  const timestamp = new Date().toISOString();
  return {
    id: credentialRecordId(userId, providerId),
    namespace: PROVIDER_CREDENTIALS_NAMESPACE,
    timestamp,
    data: {
      userId,
      providerId,
      apiKey,
      updatedAt: timestamp,
    },
    metadata: {
      userId,
      providerId,
    },
  };
}

function fromCredentialRecord(record: StorageRecord): string | undefined {
  const apiKey = record.data.apiKey;
  return typeof apiKey === "string" && apiKey.trim().length > 0
    ? apiKey.trim()
    : undefined;
}

/** {@link ProviderCredentialStore} backed by {@link StorageRuntime} (Phase 83). */
export class StorageBackedProviderCredentialStore implements ProviderCredentialStore {
  constructor(private readonly storageRuntime: StorageRuntime) {}

  saveApiKey(userId: string, providerId: string, apiKey: string): void {
    this.storageRuntime.save(toCredentialRecord(userId, providerId, apiKey));
  }

  getApiKey(userId: string, providerId: string): string | undefined {
    const record = this.storageRuntime.get(
      credentialRecordId(userId, providerId),
      PROVIDER_CREDENTIALS_NAMESPACE,
    );
    return record ? fromCredentialRecord(record) : undefined;
  }

  deleteApiKey(userId: string, providerId: string): boolean {
    return this.storageRuntime.delete(
      credentialRecordId(userId, providerId),
      PROVIDER_CREDENTIALS_NAMESPACE,
    );
  }

  hasApiKey(userId: string, providerId: string): boolean {
    return this.getApiKey(userId, providerId) !== undefined;
  }

  listConfiguredProviderIds(userId: string): readonly string[] {
    return this.storageRuntime
      .query({
        namespace: PROVIDER_CREDENTIALS_NAMESPACE,
        filter: { userId },
      })
      .map((record) => {
        const providerId = record.data.providerId;
        return typeof providerId === "string" ? providerId : "";
      })
      .filter((providerId) => providerId.length > 0);
  }
}

/** @internal test helper */
export function __createEmptyProviderSettingsForTest(): ProviderSettings {
  return {
    userId: "test-user",
    selectedProviderId: "llm-stub",
    selectedModels: {},
    updatedAt: new Date().toISOString(),
  };
}
