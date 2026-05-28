/** User-facing workforce activity from orchestrator task output (Phase 97). */
export interface WorkforceActivityView {
  readonly workerType: string;
  readonly userLabel: string;
  readonly message: string;
  readonly completed: boolean;
  readonly timestamp: string;
}

export interface WorkforceActivityViewState {
  readonly sessionId?: string;
  readonly success?: boolean;
  readonly summary?: string;
  readonly activities: readonly WorkforceActivityView[];
  readonly workerCount?: number;
  readonly parallel?: boolean;
  readonly activeLabel?: string;
  readonly completed: boolean;
}
