import { useCallback, useEffect, useState } from "react";

import {
  fetchProviderSettings,
  saveProviderApiKey,
  selectProvider,
  selectProviderModel,
  validateProviderApiKey,
} from "./provider-settings-client";
import type {
  ApiKeyValidationResult,
  ProviderSettings,
  ProviderSettingsSnapshot,
  ProviderStatus,
} from "./provider-settings-types";
import { DEFAULT_PROVIDER_SETTINGS_USER_ID } from "./provider-settings-types";

export interface UseProviderSettingsOptions {
  readonly userId?: string;
  readonly enabled?: boolean;
}

export interface UseProviderSettingsResult {
  readonly snapshot: ProviderSettingsSnapshot | null;
  readonly providers: readonly ProviderStatus[];
  readonly activeProviderId: string | null;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
  readonly saveApiKey: (
    providerId: string,
    apiKey: string,
  ) => Promise<ApiKeyValidationResult>;
  readonly validateKey: (
    providerId: string,
    apiKey?: string,
  ) => Promise<ApiKeyValidationResult>;
  readonly setActiveProvider: (providerId: string) => Promise<ProviderSettings>;
  readonly setProviderModel: (
    providerId: string,
    model: string,
  ) => Promise<ProviderSettings>;
}

/**
 * Loads and updates provider settings via desktop IPC (Phase 83).
 */
export function useProviderSettings(
  options: UseProviderSettingsOptions = {},
): UseProviderSettingsResult {
  const userId = options.userId ?? DEFAULT_PROVIDER_SETTINGS_USER_ID;
  const enabled = options.enabled ?? true;
  const [snapshot, setSnapshot] = useState<ProviderSettingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchProviderSettings(userId);
      setSnapshot(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Provider settings unavailable");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  const saveApiKey = useCallback(
    async (providerId: string, apiKey: string) => {
      setSaving(true);
      try {
        const result = await saveProviderApiKey({ userId, providerId, apiKey });
        await refresh();
        return result;
      } finally {
        setSaving(false);
      }
    },
    [refresh, userId],
  );

  const validateKey = useCallback(
    (providerId: string, apiKey?: string) =>
      validateProviderApiKey(userId, providerId, apiKey),
    [userId],
  );

  const setActiveProvider = useCallback(
    async (providerId: string) => {
      setSaving(true);
      try {
        const settings = await selectProvider({ userId, providerId });
        await refresh();
        return settings;
      } finally {
        setSaving(false);
      }
    },
    [refresh, userId],
  );

  const setProviderModel = useCallback(
    async (providerId: string, model: string) => {
      setSaving(true);
      try {
        const settings = await selectProviderModel({ userId, providerId, model });
        await refresh();
        return settings;
      } finally {
        setSaving(false);
      }
    },
    [refresh, userId],
  );

  return {
    snapshot,
    providers: snapshot?.providers ?? [],
    activeProviderId: snapshot?.settings.selectedProviderId ?? null,
    loading,
    saving,
    error,
    refresh,
    saveApiKey,
    validateKey,
    setActiveProvider,
    setProviderModel,
  };
}
