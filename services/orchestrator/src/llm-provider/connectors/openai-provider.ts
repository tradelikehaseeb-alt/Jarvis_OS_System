import { OPENAI_PROVIDER_CONFIGURATION } from "./default-provider-configurations";
import { createOpenAiCompatibleProvider } from "./create-openai-compatible-provider";

/** OpenAI connector (Phase 82). */
export class OpenAIProvider {
  readonly inner = createOpenAiCompatibleProvider(OPENAI_PROVIDER_CONFIGURATION, [
    "OPENAI_MODEL",
    "JARVIS_OPENAI_MODEL",
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

export function createOpenAIProvider(): OpenAIProvider {
  return new OpenAIProvider();
}
