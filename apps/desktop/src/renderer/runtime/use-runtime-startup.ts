import { useCallback, useEffect, useRef, useState } from "react";

import { useRuntimeHealth } from "./use-runtime-health";
import {
  getStartupStatus,
  initializeRuntime,
  recoverRuntime,
  validateRuntime,
} from "./runtime-startup-client";
import type {
  RuntimeStartupEvent,
  RuntimeStartupResponse,
  RuntimeStartupState,
} from "./runtime-startup-types";

export interface UseRuntimeStartupOptions {
  /** Sync startup status from main process on mount (default true). */
  readonly autoSync?: boolean;
  readonly pollHealthWhenReady?: boolean;
}

export interface UseRuntimeStartupResult {
  readonly status: RuntimeStartupState | null;
  readonly events: readonly RuntimeStartupEvent[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly ready: boolean;
  readonly apiBaseUrl: string | undefined;
  readonly health: ReturnType<typeof useRuntimeHealth>;
  readonly initializeRuntime: () => Promise<RuntimeStartupResponse>;
  readonly validateRuntime: () => Promise<RuntimeStartupResponse>;
  readonly recoverRuntime: () => Promise<RuntimeStartupResponse>;
  readonly getStartupStatus: () => Promise<RuntimeStartupResponse>;
  readonly refresh: () => Promise<void>;
}

function appendEvents(
  previous: readonly RuntimeStartupEvent[],
  next: readonly RuntimeStartupEvent[],
): RuntimeStartupEvent[] {
  const seen = new Set(previous.map((event) => event.id));
  const merged = [...previous];
  for (const event of next) {
    if (!seen.has(event.id)) {
      merged.push(event);
      seen.add(event.id);
    }
  }
  return merged;
}

/**
 * Desktop runtime startup and recovery hook (Phase 73).
 * Composes IPC startup flow with existing runtime health polling.
 */
export function useRuntimeStartup(
  options: UseRuntimeStartupOptions = {},
): UseRuntimeStartupResult {
  const autoSync = options.autoSync ?? true;
  const pollHealthWhenReady = options.pollHealthWhenReady ?? true;

  const [status, setStatus] = useState<RuntimeStartupState | null>(null);
  const [events, setEvents] = useState<RuntimeStartupEvent[]>([]);
  const [loading, setLoading] = useState(autoSync);
  const [error, setError] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string | undefined>();
  const startedRef = useRef(false);

  const health = useRuntimeHealth({
    enabled: pollHealthWhenReady && (status?.ready ?? false),
  });

  const applyResponse = useCallback((response: RuntimeStartupResponse) => {
    setStatus(response.state);
    setEvents((prev) => appendEvents(prev, response.events));
    setApiBaseUrl(response.apiBaseUrl);
    if (response.state.message && !response.state.ready) {
      setError(response.state.message);
    } else {
      setError(null);
    }
  }, []);

  const runOperation = useCallback(
    async (
      operation: () => Promise<RuntimeStartupResponse>,
    ): Promise<RuntimeStartupResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await operation();
        applyResponse(response);
        return response;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Runtime startup failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applyResponse],
  );

  const initialize = useCallback(
    () => runOperation(initializeRuntime),
    [runOperation],
  );
  const validate = useCallback(
    () => runOperation(validateRuntime),
    [runOperation],
  );
  const recover = useCallback(
    () => runOperation(recoverRuntime),
    [runOperation],
  );
  const readStatus = useCallback(
    () => runOperation(getStartupStatus),
    [runOperation],
  );

  const refresh = useCallback(async () => {
    await readStatus();
    if (status?.ready) {
      await health.refresh();
    }
  }, [health, readStatus, status?.ready]);

  useEffect(() => {
    if (!autoSync || startedRef.current) {
      return;
    }
    startedRef.current = true;
    void readStatus();
  }, [autoSync, readStatus]);

  return {
    status,
    events,
    loading,
    error,
    ready: status?.ready ?? false,
    apiBaseUrl,
    health,
    initializeRuntime: initialize,
    validateRuntime: validate,
    recoverRuntime: recover,
    getStartupStatus: readStatus,
    refresh,
  };
}
