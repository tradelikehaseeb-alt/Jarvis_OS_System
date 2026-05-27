import type { RuntimeHealthSnapshot, RuntimeHealthSnapshotProcess } from "./runtime-health-snapshot";

/**
 * Runtime control actions exposed to Desktop (Phase 57).
 */
export type RuntimeAction = "start" | "stop" | "restart" | "refresh-health";

/**
 * IPC request to control a managed runtime process (Phase 57).
 */
export interface RuntimeActionRequest {
  readonly action: RuntimeAction;
  readonly processId?: string;
}

/**
 * IPC response from a runtime control action (Phase 57).
 */
export interface RuntimeActionResponse {
  readonly ok: boolean;
  readonly action: RuntimeAction;
  readonly processId?: string;
  readonly message?: string;
  readonly error?: string;
  readonly process?: RuntimeHealthSnapshotProcess;
  readonly health?: RuntimeHealthSnapshot;
}
