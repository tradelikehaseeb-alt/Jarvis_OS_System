import { GROQ_PROVIDER_CONFIGURATION } from "./default-provider-configurations";
import { createOpenAiCompatibleProvider } from "./create-openai-compatible-provider";

/** Groq connector (Phase 82). */
export class GroqProvider {
  readonly inner = createOpenAiCompatibleProvider(GROQ_PROVIDER_CONFIGURATION, [
    "GROQ_MODEL",
    "JARVIS_GROQ_MODEL",
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

export function createGroqProvider(): GroqProvider {
  return new GroqProvider();
}
