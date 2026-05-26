/**
 * Output from {@link OpenClawAdapter.invoke} (Phase 16).
 */
export interface OpenClawResponse {
  readonly success: boolean;
  readonly adapterId: string;
  readonly stub: boolean;
  readonly execution: {
    readonly status: "accepted" | "rejected" | "pending";
    readonly sandbox: boolean;
    readonly permissionsChecked: boolean;
    readonly handleId: string;
  };
  readonly approvedActions: readonly string[];
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}
