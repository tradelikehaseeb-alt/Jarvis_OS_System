/**
 * Browser runtime health snapshot (Phase 61).
 */
export interface BrowserRuntimeHealth {
  readonly valid: boolean;
  readonly stub: boolean;
  readonly available: boolean;
  readonly message: string;
  readonly checkedAt: string;
}
