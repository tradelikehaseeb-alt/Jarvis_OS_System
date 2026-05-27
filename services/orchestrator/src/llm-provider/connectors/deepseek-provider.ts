import { DEEPSEEK_PROVIDER_CONFIGURATION } from "./default-provider-configurations";
import { createOpenAiCompatibleProvider } from "./create-openai-compatible-provider";

/** DeepSeek connector (Phase 82). */
export class DeepSeekProvider {
  readonly inner = createOpenAiCompatibleProvider(DEEPSEEK_PROVIDER_CONFIGURATION, [
    "DEEPSEEK_MODEL",
    "JARVIS_DEEPSEEK_MODEL",
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

export function createDeepSeekProvider(): DeepSeekProvider {
  return new DeepSeekProvider();
}
