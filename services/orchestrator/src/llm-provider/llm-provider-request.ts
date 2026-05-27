/**
 * LLM prompt execution request (Phase 81).
 */
export interface LlmProviderRequest {
  readonly providerId: string;
  readonly prompt: string;
  readonly model?: string;
  readonly userId?: string;
  readonly taskId?: string;
  readonly systemPrompt?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Internal credential — never log or expose in API responses (Phase 83). */
  readonly providerApiKey?: string;
}
