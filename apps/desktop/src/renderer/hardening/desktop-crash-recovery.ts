import {
  clearCrashRecoveryPending,
  loadSessionCheckpoint,
  readCrashRecoveryPending,
  type SessionCheckpointPayload,
} from "./session-checkpoint-storage";

export interface DesktopCrashRecoveryState {
  readonly pending: boolean;
  readonly pendingSince?: string;
  readonly checkpoint?: SessionCheckpointPayload;
  readonly message?: string;
}

/**
 * Renderer-side crash recovery state reader (Phase 94).
 */
export class DesktopCrashRecovery {
  inspect(sessionId?: string): DesktopCrashRecoveryState {
    const pendingSince = readCrashRecoveryPending();
    const checkpoint = sessionId ? loadSessionCheckpoint(sessionId) : undefined;

    if (!pendingSince && !checkpoint) {
      return { pending: false };
    }

    return {
      pending: Boolean(pendingSince),
      pendingSince,
      checkpoint,
      message: pendingSince
        ? "Restored after an unexpected interruption"
        : checkpoint
          ? "Session restored"
          : undefined,
    };
  }

  acknowledgeRecovery(): void {
    clearCrashRecoveryPending();
  }
}

export const desktopCrashRecovery = new DesktopCrashRecovery();
