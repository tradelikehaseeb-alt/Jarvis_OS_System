import { GEMINI_PROVIDER_CONFIGURATION } from "./default-provider-configurations";
import { createOpenAiCompatibleProvider } from "./create-openai-compatible-provider";

/** Google Gemini connector (Phase 82). */
export class GeminiProvider {
  readonly inner = createOpenAiCompatibleProvider(GEMINI_PROVIDER_CONFIGURATION, [
    "GEMINI_MODEL",
    "JARVIS_GEMINI_MODEL",
  ]);

  get providerId(): string {
    return this.inner.providerId;
  }

  get kind() {
    return this.inner.kind;
  }

  get label(): string {
    return this.inner.label;
  }

  validateProvider = this.inner.validateProvider.bind(this.inner);
  executePrompt = this.inner.executePrompt.bind(this.inner);
  streamResponse = this.inner.streamResponse.bind(this.inner);
}

export function createGeminiProvider(): GeminiProvider {
  return new GeminiProvider();
}
