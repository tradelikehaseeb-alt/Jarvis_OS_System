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
}
