/**
 * Managed runtime process lifecycle states (Phase 56).
 */
export type RuntimeProcessState =
  | "stopped"
  | "starting"
  | "running"
  | "restarting"
  | "failed";

/**
 * IPC payload from main-process process manager (Phase 56).
 */
export interface RuntimeHealthSnapshot {
  readonly health: {
    readonly status: "healthy" | "degraded" | "unavailable";
    readonly processCount: number;
    readonly runningCount: number;
    readonly failedCount: number;
    readonly checkedAt: string;
  };
  readonly processes: readonly RuntimeHealthSnapshotProcess[];
}

export interface RuntimeHealthSnapshotProcess {
  readonly processId: string;
  readonly label: string;
  readonly state: RuntimeProcessState;
  readonly healthy: boolean;
  readonly restartCount: number;
  readonly lastError?: string;
  readonly startedAt?: string;
  readonly stoppedAt?: string;
}
