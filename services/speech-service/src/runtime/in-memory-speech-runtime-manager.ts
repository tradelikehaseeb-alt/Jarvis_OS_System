import type { SpeechRuntimeHealth, SpeechRuntimeProviderId } from "./speech-runtime-health";
import type { SpeechRuntimeManager } from "./speech-runtime-manager";
import type { SpeechRuntimeProvider } from "./speech-runtime-provider";

/**
 * In-memory runtime manager for stub speech providers (Phase 29).
 */
export class InMemorySpeechRuntimeManager implements SpeechRuntimeManager {
  private readonly providers = new Map<SpeechRuntimeProviderId, SpeechRuntimeProvider>();

  register(provider: SpeechRuntimeProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  get(providerId: SpeechRuntimeProviderId): SpeechRuntimeProvider | undefined {
    return this.providers.get(providerId);
  }

  listProviderIds(): readonly SpeechRuntimeProviderId[] {
    return [...this.providers.keys()].sort((a, b) => a.localeCompare(b));
  }

  async checkHealth(providerId: SpeechRuntimeProviderId): Promise<SpeechRuntimeHealth> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Speech runtime provider not registered: ${providerId}`);
    }
    return provider.checkHealth();
  }
}
