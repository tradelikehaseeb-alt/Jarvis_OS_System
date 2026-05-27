/**
 * Point-in-time browser page snapshot (Phase 70).
 */
export interface BrowserPageSnapshot {
  readonly snapshotId: string;
  readonly url?: string;
  readonly title?: string;
  readonly activeSelector?: string;
  readonly extractedContent?: string;
  readonly capturedAt: string;
}
