/**
 * Optional hints for transcript normalization (Phase 26).
 *
 * No audio or STT metadata — text-only cleanup before future STT wiring.
 */
export interface SpeechContext {
  /** Correlation id for logging (future HTTP API). */
  readonly sessionId?: string;
  readonly userId?: string;
  /** BCP-47 locale hint, e.g. `en`, `en-PK`. */
  readonly localeHint?: string;
  /**
   * Domain profile — enables trading-specific homophone rules.
   * @default "general"
   */
  readonly domain?: SpeechDomain;
}

/** Normalization domain profiles. */
export type SpeechDomain = "general" | "trading";

/** Default context when none is supplied. */
export const DEFAULT_SPEECH_CONTEXT: SpeechContext = {
  domain: "general",
} as const;
