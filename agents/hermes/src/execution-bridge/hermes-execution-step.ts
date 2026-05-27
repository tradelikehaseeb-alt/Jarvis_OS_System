/**
 * Executable step derived from a Hermes structured plan (Phase 77).
 */
export interface HermesExecutionStep {
  readonly stepId: string;
  readonly index: number;
  readonly label: string;
  readonly description: string;
  readonly stub: boolean;
}
