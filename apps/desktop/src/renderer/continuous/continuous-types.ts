/** User-facing continuous runtime state from orchestrator task output (Phase 99). */
export interface ContinuousActivityView {
  readonly kind: string;
  readonly userLabel: string;
  readonly message: string;
  readonly background: boolean;
  readonly completed: boolean;
  readonly timestamp: string;
}

export interface ContinuousNotificationView {
  readonly message: string;
  readonly userLabel: string;
  readonly kind: string;
}

export interface ContinuousViewState {
  readonly sessionId?: string;
  readonly success?: boolean;
  readonly summary?: string;
  readonly activities: readonly ContinuousActivityView[];
  readonly notifications: readonly ContinuousNotificationView[];
  readonly backgroundTaskCount?: number;
  readonly continuous?: boolean;
  readonly presence?: string;
  readonly activeLabel?: string;
  readonly completed: boolean;
}
