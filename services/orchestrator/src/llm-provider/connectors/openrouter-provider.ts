import { OPENROUTER_PROVIDER_CONFIGURATION } from "./default-provider-configurations";
import { createOpenAiCompatibleProvider } from "./create-openai-compatible-provider";

/** OpenRouter connector (Phase 82). */
export class OpenRouterProvider {
  readonly inner = createOpenAiCompatibleProvider(
    OPENROUTER_PROVIDER_CONFIGURATION,
    ["OPENROUTER_MODEL", "JARVIS_OPENROUTER_MODEL"],
    {
      "HTTP-Referer": "https://jarvis.local",
      "X-Title": "Jarvis OS",
    },
  );

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

export function createOpenRouterProvider(): OpenRouterProvider {
  return new OpenRouterProvider();
}
