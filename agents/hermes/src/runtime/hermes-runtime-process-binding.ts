/**
 * Optional binding to Jarvis runtime process manager for Hermes runtime (Phase 59).
 */
export interface HermesRuntimeProcessBinding {
  ensureHermesRuntimeRunning(): Promise<boolean>;
  getHermesProcessState(): Promise<string | undefined>;
}
