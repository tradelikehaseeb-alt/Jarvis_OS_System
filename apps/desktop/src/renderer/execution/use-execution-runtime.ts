import { useCallback, useMemo, useState } from "react";

import type { ExecutionRuntimeView } from "./execution-runtime-types";
import { mapExecutionRuntimeFromTaskOutput } from "./map-execution-runtime";

export interface UseExecutionRuntimeOptions {
  readonly taskOutput?: Readonly<Record<string, unknown>>;
}

export interface UseExecutionRuntimeResult {
  readonly executionRuntime?: ExecutionRuntimeView;
  readonly permissionGranted: boolean;
  readonly approvePermission: () => void;
  readonly denyPermission: () => void;
  readonly cancelExecution: () => void;
  readonly cancelled: boolean;
}

/**
 * Tracks live execution runtime state from task output (Phase 95).
 */
export function useExecutionRuntime(
  options: UseExecutionRuntimeOptions = {},
): UseExecutionRuntimeResult {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const executionRuntime = useMemo(
    () => mapExecutionRuntimeFromTaskOutput(options.taskOutput),
    [options.taskOutput],
  );

  const approvePermission = useCallback(() => {
    setPermissionGranted(true);
  }, []);

  const denyPermission = useCallback(() => {
    setPermissionGranted(false);
    setCancelled(true);
  }, []);

  const cancelExecution = useCallback(() => {
    setCancelled(true);
  }, []);

  return {
    executionRuntime,
    permissionGranted,
    approvePermission,
    denyPermission,
    cancelExecution,
    cancelled,
  };
}
