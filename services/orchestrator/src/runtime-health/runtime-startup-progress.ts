import type { RuntimeStartupPhase } from "../runtime-startup/runtime-startup-state";

/**
 * Desktop-visible startup progress derived from startup manager state (Phase 74).
 */
export interface RuntimeStartupProgress {
  readonly phase: RuntimeStartupPhase;
  readonly percent: number;
  readonly ready: boolean;
  readonly message?: string;
}

const PHASE_PERCENT: Record<RuntimeStartupPhase, number> = {
  idle: 0,
  bootstrapping: 25,
  validating: 50,
  recovering: 75,
  ready: 100,
  degraded: 90,
  failed: 100,
};

/**
 * Maps startup phase to progress percent without duplicating startup manager logic.
 */
export function startupPhaseToPercent(phase: RuntimeStartupPhase): number {
  return PHASE_PERCENT[phase];
}
