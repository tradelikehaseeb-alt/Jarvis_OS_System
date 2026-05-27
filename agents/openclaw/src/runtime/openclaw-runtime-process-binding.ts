/**
 * Optional binding to Jarvis runtime process manager for OpenClaw runtime (Phase 58).
 */
export interface OpenClawRuntimeProcessBinding {
  ensureOpenClawRuntimeRunning(): Promise<boolean>;
  getOpenClawProcessState(): Promise<string | undefined>;
}
