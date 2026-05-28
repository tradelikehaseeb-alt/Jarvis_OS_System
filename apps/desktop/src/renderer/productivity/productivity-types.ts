/** User-facing productivity state from orchestrator task output (Phase 98). */
export interface ProductivityActivityView {
  readonly kind: string;
  readonly userLabel: string;
  readonly message: string;
  readonly completed: boolean;
  readonly timestamp: string;
}

export interface ProductivitySuggestionView {
  readonly message: string;
  readonly kind: string;
}

export interface ProductivityViewState {
  readonly sessionId?: string;
  readonly success?: boolean;
  readonly summary?: string;
  readonly activities: readonly ProductivityActivityView[];
  readonly suggestions: readonly ProductivitySuggestionView[];
  readonly taskCount?: number;
  readonly activeLabel?: string;
  readonly completed: boolean;
}
