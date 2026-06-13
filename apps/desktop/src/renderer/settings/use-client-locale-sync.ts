import { useEffect, useState } from "react";

import {
  resolveRendererClientLocale,
  type RendererClientLocale,
} from "./resolve-renderer-client-locale";
import { syncClientLocaleToMain } from "./sync-client-locale";

/**
 * Syncs the user's localized timezone/city to the provider factory on boot.
 */
export function useClientLocaleSync(enabled = true): {
  readonly locale: RendererClientLocale | null;
  readonly syncing: boolean;
  readonly error: string | null;
} {
  const [locale, setLocale] = useState<RendererClientLocale | null>(null);
  const [syncing, setSyncing] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const resolved = resolveRendererClientLocale();
    setLocale(resolved);

    void (async () => {
      try {
        const synced = await syncClientLocaleToMain(resolved);
        setLocale(synced);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Locale sync failed");
      } finally {
        setSyncing(false);
      }
    })();
  }, [enabled]);

  return { locale, syncing, error };
}
