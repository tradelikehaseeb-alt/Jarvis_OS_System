/**
 * Health probe delegate for runtime startup validation (Phase 73).
 */
export interface RuntimeStartupHealthProbe {
  readonly probeId: string;
  readonly label: string;
  check(): Promise<{ readonly healthy: boolean; readonly message?: string }>;
}
