import { useCallback, useState } from "react";

import { executeRuntimeAction } from "./runtime-actions-client";
import type { RuntimeAction } from "./runtime-action";
import type { RuntimeActionRequest } from "./runtime-action-request";
import type { RuntimeActionResponse } from "./runtime-action-response";

export interface UseRuntimeActionsOptions {
  readonly onActionComplete?: (response: RuntimeActionResponse) => void;
}

export interface UseRuntimeActionsResult {
  readonly loading: boolean;
  readonly activeAction: RuntimeAction | null;
  readonly activeProcessId: string | null;
  readonly lastResponse: RuntimeActionResponse | null;
  readonly error: string | null;
  readonly runAction: (request: RuntimeActionRequest) => Promise<RuntimeActionResponse>;
  readonly startProcess: (processId: string) => Promise<RuntimeActionResponse>;
  readonly stopProcess: (processId: string) => Promise<RuntimeActionResponse>;
  readonly restartProcess: (processId: string) => Promise<RuntimeActionResponse>;
  readonly refreshHealth: () => Promise<RuntimeActionResponse>;
}

/**
 * Controls managed runtime processes via IPC (Phase 57).
 */
export function useRuntimeActions(
  options: UseRuntimeActionsOptions = {},
): UseRuntimeActionsResult {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<RuntimeAction | null>(null);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<RuntimeActionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { onActionComplete } = options;

  const runAction = useCallback(
    async (request: RuntimeActionRequest): Promise<RuntimeActionResponse> => {
      setLoading(true);
      setActiveAction(request.action);
      setActiveProcessId(request.processId ?? null);
      setError(null);

      try {
        const response = await executeRuntimeAction(request);
        setLastResponse(response);

        if (!response.ok) {
          setError(response.error ?? response.message ?? "Runtime action failed");
        }

        onActionComplete?.(response);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Runtime action failed";
        setError(message);
        const failure: RuntimeActionResponse = {
          ok: false,
          action: request.action,
          processId: request.processId,
          error: message,
        };
        setLastResponse(failure);
        onActionComplete?.(failure);
        return failure;
      } finally {
        setLoading(false);
        setActiveAction(null);
        setActiveProcessId(null);
      }
    },
    [onActionComplete],
  );

  const startProcess = useCallback(
    (processId: string) => runAction({ action: "start", processId }),
    [runAction],
  );

  const stopProcess = useCallback(
    (processId: string) => runAction({ action: "stop", processId }),
    [runAction],
  );

  const restartProcess = useCallback(
    (processId: string) => runAction({ action: "restart", processId }),
    [runAction],
  );

  const refreshHealth = useCallback(
    () => runAction({ action: "refresh-health" }),
    [runAction],
  );

  return {
    loading,
    activeAction,
    activeProcessId,
    lastResponse,
    error,
    runAction,
    startProcess,
    stopProcess,
    restartProcess,
    refreshHealth,
  };
}
