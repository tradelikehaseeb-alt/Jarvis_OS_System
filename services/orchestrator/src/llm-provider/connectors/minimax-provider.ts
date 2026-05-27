import { MINIMAX_PROVIDER_CONFIGURATION } from "./default-provider-configurations";
import { createOpenAiCompatibleProvider } from "./create-openai-compatible-provider";

/** Minimax connector (Phase 82). */
export class MinimaxProvider {
  readonly inner = createOpenAiCompatibleProvider(MINIMAX_PROVIDER_CONFIGURATION, [
    "MINIMAX_MODEL",
    "JARVIS_MINIMAX_MODEL",
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

export function createMinimaxProvider(): MinimaxProvider {
  return new MinimaxProvider();
}
