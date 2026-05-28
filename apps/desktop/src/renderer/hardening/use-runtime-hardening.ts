import { useEffect, useMemo, useState } from "react";

import { desktopCrashRecovery } from "./desktop-crash-recovery";
import { sessionRestoreRuntime } from "./session-restore-runtime";

export interface UseRuntimeHardeningOptions {
  readonly sessionId?: string;
  readonly enabled?: boolean;
}

export interface UseRuntimeHardeningResult {
  readonly recoveryMessage?: string;
  readonly restoredMessagesCount: number;
  readonly acknowledgeRecovery: () => void;
  readonly persistCheckpoint: (
    conversationId: string,
    messages: readonly { id: string; role: string; text: string }[],
    pendingTaskId?: string,
  ) => void;
}

/**
 * Desktop runtime hardening hook — crash recovery + session restore (Phase 94).
 */
export function useRuntimeHardening(
  options: UseRuntimeHardeningOptions = {},
): UseRuntimeHardeningResult {
  const enabled = options.enabled ?? true;
  const [recoveryMessage, setRecoveryMessage] = useState<string | undefined>();
  const [restoredMessagesCount, setRestoredMessagesCount] = useState(0);

  useEffect(() => {
    if (!enabled || !options.sessionId) {
      return;
    }
    const state = desktopCrashRecovery.inspect(options.sessionId);
    if (state.message) {
      setRecoveryMessage(state.message);
    }
    if (state.checkpoint) {
      const restored = sessionRestoreRuntime.restore(options.sessionId);
      setRestoredMessagesCount(restored.messages.length);
    }
  }, [enabled, options.sessionId]);

  const acknowledgeRecovery = useMemo(
    () => () => {
      desktopCrashRecovery.acknowledgeRecovery();
      setRecoveryMessage(undefined);
    },
    [],
  );

  const persistCheckpoint = (
    conversationId: string,
    messages: readonly { id: string; role: string; text: string }[],
    pendingTaskId?: string,
  ) => {
    if (!options.sessionId) {
      return;
    }
    sessionRestoreRuntime.persistCheckpoint(
      options.sessionId,
      conversationId,
      messages,
      pendingTaskId,
    );
  };

  return {
    recoveryMessage,
    restoredMessagesCount,
    acknowledgeRecovery,
    persistCheckpoint,
  };
}
